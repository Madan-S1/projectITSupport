"""
Validation service: the ONLY module that decides what "invalid AI
response" means for the business.

Two distinct kinds of invalidity are handled here, deliberately kept
separate:

1. SCHEMA invalidity -- the raw dict doesn't parse into a TriageResult at
   all (wrong type, missing required field, category/priority outside the
   allowed enum, confidence outside [0, 1], or -- via the model's own
   field_validator -- needs_follow_up=True with no follow_up_question).
   This is caught by Pydantic itself; we just wrap it in a clearer
   exception type.

2. SEMANTIC invalidity -- the dict parses fine as a TriageResult, but its
   fields contradict each other in a way Pydantic's per-field validation
   can't see holistically (e.g. the AI listed missing_information but
   still claimed needs_follow_up=False). This is exactly the kind of
   "don't blindly trust the AI's own needs_follow_up boolean" check
   described in the architecture: ownership of that decision stays here
   and in triage_service.py, not inside ai_service.py.

Both cases raise the same AIOutputInvalidError so triage_service.py can
treat them uniformly: retry the AI call once, then fall back.
"""

from pydantic import ValidationError

from app.models import TriageResult


class AIOutputInvalidError(Exception):
    """Raised when the AI's output fails schema validation or fails a
    semantic consistency check. Callers must never construct a
    TriageResult from data that raised this -- the correct response is
    to retry the AI call or fall back to TriageUnavailable, never to
    patch the result with invented values."""


def parse_triage_result(raw: dict) -> TriageResult:
    """Validate a raw dict (as returned by ai_service.call_triage_model)
    against the TriageResult schema. Raises AIOutputInvalidError on any
    schema violation -- wrong enum value, out-of-range confidence, a
    missing required field, or needs_follow_up=True with no question."""
    try:
        return TriageResult.model_validate(raw)
    except ValidationError as exc:
        raise AIOutputInvalidError(f"AI output failed schema validation: {exc}") from exc


def check_semantic_consistency(result: TriageResult) -> TriageResult:
    """
    Holistic checks across fields that a single-field validator can't
    express. Two kinds of outcome:

    - A contradiction we can SAFELY resolve by narrowing (removing data
      the AI shouldn't have included), which is not fabrication because
      nothing is invented -- only cleared.
    - A contradiction that would require inventing something (e.g. the AI
      says needs_follow_up=False but also listed real missing
      information) -- this is NOT silently "corrected" to
      needs_follow_up=True, because we have no follow_up_question to
      pair with it and are not permitted to invent one. Instead it's
      treated as an invalid AI response, so triage_service.py retries or
      falls back rather than serving a result we don't trust.
    """
    # Safe narrowing: if the AI isn't asking a follow-up, it shouldn't
    # have populated follow_up_question. Clearing an unwanted value is
    # not inventing one.
    if not result.needs_follow_up and result.follow_up_question is not None:
        result = result.model_copy(update={"follow_up_question": None})

    # Unsafe contradiction: the AI itself listed relevant unknowns but
    # claims it doesn't need to ask about them. We do not guess which of
    # the two signals ("needs_follow_up" vs "missing_information") is the
    # trustworthy one, so this is treated as invalid output.
    if result.missing_information and not result.needs_follow_up:
        raise AIOutputInvalidError(
            "Inconsistent AI output: missing_information was populated "
            "but needs_follow_up is False."
        )

    return result

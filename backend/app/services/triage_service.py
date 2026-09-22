"""
Triage service: the orchestrator.

This is the only module that ties ai_service.py (talks to OpenAI) and
validation_service.py (decides what "invalid" means) together into the
actual business flow described in Phase 1:

    Ticket -> Analyze -> enough information?
        YES -> recommend + reason
        NO  -> missing info + one follow-up question

It owns two decisions that deliberately do NOT live in ai_service.py:

1. Retrying on SEMANTICALLY invalid output (schema-valid but internally
   contradictory, or failing check_semantic_consistency) is a business
   decision, separate from ai_service.py's own retries, which only cover
   TRANSPORT failures (timeouts, malformed JSON, API errors). Conflating
   the two would mean ai_service.py silently absorbing business logic
   about what counts as a trustworthy result.

2. Falling back to TriageUnavailable -- for either a transport failure
   (AIServiceError) or an exhausted semantic-invalid retry -- happens
   here, not in ai_service.py or validation_service.py, so the fallback
   decision has one clear owner.
"""

from typing import Union

from app.models import TriageRequest, TriageResult, TriageUnavailable
from app.services.ai_service import AIServiceError, call_triage_model
from app.services.validation_service import (
    AIOutputInvalidError,
    check_semantic_consistency,
    parse_triage_result,
)

# One retry here covers a SEMANTICALLY invalid response (e.g. the model
# contradicted itself). This is intentionally separate from and in
# addition to ai_service's own transport-level retries.
MAX_SEMANTIC_RETRIES = 1


def analyze_ticket(request: TriageRequest) -> Union[TriageResult, TriageUnavailable]:
    """
    Run the full triage pipeline for one ticket (initial or follow-up
    re-analysis -- the caller distinguishes these via
    request.conversation_history, which this function passes through
    unchanged).

    Returns either a validated TriageResult or a TriageUnavailable. Never
    raises to the caller under normal failure modes -- routes/triage.py
    only needs to branch on the return type.
    """
    attempts = MAX_SEMANTIC_RETRIES + 1

    for attempt in range(attempts):
        try:
            raw = call_triage_model(request.message, request.conversation_history)
        except AIServiceError:
            # Transport-level failure, already retried inside ai_service.
            # No point retrying again here -- go straight to fallback.
            return _unavailable(request.message)

        try:
            result = parse_triage_result(raw)
            result = check_semantic_consistency(result)
            return result
        except AIOutputInvalidError:
            if attempt < attempts - 1:
                continue  # one more full AI call, per MAX_SEMANTIC_RETRIES
            return _unavailable(request.message)

    # Unreachable, but keeps type-checkers and readers confident there's
    # no silent fall-through that could return None.
    return _unavailable(request.message)


def _unavailable(original_message: str) -> TriageUnavailable:
    return TriageUnavailable(original_message=original_message)

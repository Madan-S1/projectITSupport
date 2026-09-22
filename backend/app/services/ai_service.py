"""
AI service: the ONLY module that knows OpenAI's API shape.

Responsibilities:
  - Build the structured-output JSON schema OpenAI must conform to
  - Call the model with the triage system prompt + assembled ticket text
  - Enforce a timeout and a small number of retries
  - Parse the model's JSON text into a plain dict

What this module deliberately does NOT do:
  - Validate the dict against TriageResult (that's validation_service.py)
  - Decide what "invalid" or "insufficient evidence" means for the
    business (that's triage_service.py)
  - Know anything about HTTP/FastAPI

This separation is what makes it possible to swap providers (e.g. to
Anthropic's API) later by rewriting only this file.
"""

import json
import time
from typing import List

from openai import OpenAI, APIError, APITimeoutError

from app.config import settings
from app.models import Category, FollowUpExchange, Priority
from app.prompts.triage_prompt import SYSTEM_PROMPT, build_user_message


class AIServiceError(Exception):
    """Raised when the AI call fails outright (timeout, API error, or
    the model's output can't even be parsed as JSON) after retries are
    exhausted. Callers treat this as "automated analysis unavailable",
    never as a signal to fabricate a result."""


# Lazily constructed so importing this module doesn't require an API key
# to be present (e.g. when only running tests against other modules).
_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        kwargs = {
            "api_key": settings.openai_api_key,
            "timeout": settings.ai_request_timeout_seconds,
        }
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        _client = OpenAI(**kwargs)
    return _client


def _build_response_schema() -> dict:
    """
    The JSON schema handed to OpenAI's structured-output mode
    (response_format={"type": "json_schema", ...}).

    This mirrors TriageResult field-for-field. It's kept as an explicit,
    hand-written schema (rather than derived automatically from the
    Pydantic model) because OpenAI's structured-output mode has its own
    requirements (e.g. every property required, additionalProperties:
    false, no $defs for simple enums) that don't always match Pydantic's
    default JSON Schema output. TriageResult remains the single source of
    truth for VALIDATING the result either way -- this schema only
    controls what shape the model is constrained to produce.
    """
    return {
        "name": "triage_result",
        "strict": True,
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "category": {"type": "string", "enum": [c.value for c in Category]},
                "priority": {"type": "string", "enum": [p.value for p in Priority]},
                "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                "issue_summary": {"type": "string"},
                "affected_component": {"type": ["string", "null"]},
                "urgency_factors": {"type": "array", "items": {"type": "string"}},
                "impact_indicators": {"type": "array", "items": {"type": "string"}},
                "missing_information": {"type": "array", "items": {"type": "string"}},
                "needs_follow_up": {"type": "boolean"},
                "follow_up_question": {"type": ["string", "null"]},
                "recommended_action": {"type": "string"},
                "reason": {"type": "string"},
                "expected_observation": {"type": "string"},
                "possible_next_direction": {"type": "string"},
            },
            "required": [
                "category",
                "priority",
                "confidence",
                "issue_summary",
                "affected_component",
                "urgency_factors",
                "impact_indicators",
                "missing_information",
                "needs_follow_up",
                "follow_up_question",
                "recommended_action",
                "reason",
                "expected_observation",
                "possible_next_direction",
            ],
        },
    }


def call_triage_model(
    message: str, conversation_history: List[FollowUpExchange]
) -> dict:
    """
    Calls the AI model once, retrying up to settings.ai_max_retries times
    on timeout, API error, or unparseable JSON.

    Returns a plain dict straight from json.loads -- NOT yet validated as
    a TriageResult. The caller (triage_service.py) is responsible for
    running it through validation_service.py, which is where "invalid AI
    response" (spec section 9) actually gets decided and handled.

    Raises AIServiceError if every attempt fails.
    """
    if not settings.is_configured():
        raise AIServiceError("OPENAI_API_KEY is not configured.")

    user_message = build_user_message(message, conversation_history)
    client = _get_client()
    schema = _build_response_schema()

    last_error: Exception | None = None
    attempts = settings.ai_max_retries + 1

    for attempt in range(attempts):
        try:
            try:
                response = client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    response_format={"type": "json_schema", "json_schema": schema},
                    timeout=settings.ai_request_timeout_seconds,
                )
            except APIError as exc:
                # If the endpoint/model doesn't support json_schema, fallback to json_object mode
                if "json_schema" in str(exc).lower() or "response_format" in str(exc).lower() or getattr(exc, "status_code", None) == 400:
                    response = client.chat.completions.create(
                        model=settings.openai_model,
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT + "\n\nReturn JSON conforming to the requested schema."},
                            {"role": "user", "content": user_message},
                        ],
                        response_format={"type": "json_object"},
                        timeout=settings.ai_request_timeout_seconds,
                    )
                else:
                    raise exc

            raw_text = response.choices[0].message.content
            return json.loads(raw_text)

        except APITimeoutError as exc:
            last_error = exc
        except APIError as exc:
            last_error = exc
        except (json.JSONDecodeError, IndexError, AttributeError) as exc:
            # Model returned something we couldn't even parse as JSON --
            # treated the same as a transport failure: retry, then give up.
            last_error = exc

        if attempt < attempts - 1:
            time.sleep(0.5 * (attempt + 1))  # brief linear backoff

    raise AIServiceError(
        f"AI triage call failed after {attempts} attempt(s): {last_error}"
    )


"""
Tests for app.services.triage_service (the orchestrator), against real
TriageRequest/TriageResult/TriageUnavailable. Run with:
    pip install -r requirements.txt && pytest

Mirrors the scenarios already verified in the sandbox harness
(run_triage_service_tests.py, not part of this repo) against real
pydantic models instead of duck-typed stand-ins.
"""

from unittest.mock import patch

from app.models import TriageRequest, TriageResult, TriageUnavailable
from app.services import triage_service
from app.services.ai_service import AIServiceError
from app.services.validation_service import AIOutputInvalidError

VALID_RAW = {
    "category": "Network",
    "priority": "High",
    "confidence": 0.85,
    "issue_summary": "Wi-Fi connected but internet-dependent apps failing.",
    "affected_component": "Wi-Fi / Teams",
    "urgency_factors": ["client call in 20 minutes"],
    "impact_indicators": ["multiple services affected"],
    "missing_information": [],
    "needs_follow_up": False,
    "follow_up_question": None,
    "recommended_action": "Check whether the laptop can reach a known external website.",
    "reason": "Testing raw external connectivity isolates network vs. app-specific failure.",
    "expected_observation": "If external sites also fail, the issue is network-wide.",
    "possible_next_direction": "If external sites work, investigate Teams/DNS specifically.",
}


def _request(message="The internet is down."):
    return TriageRequest(message=message)


def test_success_on_first_attempt_returns_triage_result():
    with patch.object(triage_service, "call_triage_model", return_value=VALID_RAW) as m_call:
        result = triage_service.analyze_ticket(_request())
    assert isinstance(result, TriageResult)
    assert m_call.call_count == 1


def test_ai_service_error_goes_straight_to_fallback():
    with patch.object(triage_service, "call_triage_model", side_effect=AIServiceError("boom")) as m_call:
        result = triage_service.analyze_ticket(_request("some ticket"))
    assert isinstance(result, TriageUnavailable)
    assert result.original_message == "some ticket"
    assert m_call.call_count == 1  # no extra retry on top of ai_service's own


def test_schema_invalid_both_attempts_falls_back():
    with patch.object(triage_service, "call_triage_model", return_value={"garbage": True}) as m_call:
        result = triage_service.analyze_ticket(_request())
    assert isinstance(result, TriageUnavailable)
    assert m_call.call_count == 2  # initial + 1 semantic retry


def test_semantic_inconsistency_triggers_retry_and_recovers():
    inconsistent_raw = {
        **VALID_RAW,
        "missing_information": ["whether other users are affected"],
        "needs_follow_up": False,
    }
    consistent_raw = {
        **VALID_RAW,
        "missing_information": ["whether other users are affected"],
        "needs_follow_up": True,
        "follow_up_question": "Are other employees nearby experiencing the same problem?",
    }
    with patch.object(
        triage_service, "call_triage_model", side_effect=[inconsistent_raw, consistent_raw]
    ) as m_call:
        result = triage_service.analyze_ticket(_request())
    assert isinstance(result, TriageResult)
    assert result.needs_follow_up is True
    assert m_call.call_count == 2


def test_ambiguous_ticket_end_to_end_does_not_fabricate_diagnosis():
    """The headline scenario: 'The internet is down.' must not silently
    receive a confident, specific recommendation when the AI itself
    reported missing information."""
    ambiguous_raw = {
        **VALID_RAW,
        "confidence": 0.3,
        "missing_information": [
            "Whether other employees are affected",
            "When the issue started",
        ],
        "needs_follow_up": True,
        "follow_up_question": "Are other employees nearby experiencing the same internet problem?",
        "recommended_action": "Confirm scope by checking with nearby colleagues before further diagnosis.",
    }
    with patch.object(triage_service, "call_triage_model", return_value=ambiguous_raw):
        result = triage_service.analyze_ticket(_request("The internet is down."))

    assert isinstance(result, TriageResult)
    assert result.needs_follow_up is True
    assert result.follow_up_question is not None

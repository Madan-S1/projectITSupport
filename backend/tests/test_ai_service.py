"""
Tests for app.services.ai_service.

Scope: these tests verify CONTROL FLOW ONLY -- retry counts, exception
propagation, and the architectural boundary that ai_service returns a
plain dict rather than a validated TriageResult. They mock the OpenAI
client entirely, so they do NOT verify actual model judgment (e.g.
whether the real model correctly decides an ambiguous ticket needs a
follow-up). That requires a live call -- see scripts/verify_structured_output.py
for a script that exercises cases 2 and 3 against the real API.
"""

import json
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from app.config import settings
from app.services import ai_service
from app.services.ai_service import AIServiceError, call_triage_model


def _fake_response(content_dict: dict):
    """Build an object shaped like OpenAI's chat.completions.create()
    response, just deep enough for call_triage_model to read
    response.choices[0].message.content."""
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(content_dict)))]
    )


VALID_RESULT = {
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
    "reason": "Wi-Fi is connected but multiple apps fail, so testing raw external connectivity isolates network vs. app-specific failure.",
    "expected_observation": "If external sites also fail, the issue is network-wide rather than Teams-specific.",
    "possible_next_direction": "If external sites work, investigate Teams/DNS specifically.",
}

AMBIGUOUS_RESULT = {
    **VALID_RESULT,
    "category": "Network",
    "priority": "Medium",
    "confidence": 0.35,
    "issue_summary": "Employee reports the internet is down.",
    "missing_information": [
        "Whether other employees are affected",
        "Whether the device is connected to Wi-Fi",
        "When the issue started",
    ],
    "needs_follow_up": True,
    "follow_up_question": "Are other employees nearby experiencing the same internet problem?",
    "recommended_action": "Confirm scope by checking with nearby colleagues before further diagnosis.",
}


@pytest.fixture(autouse=True)
def _reset_client_and_settings():
    """Ensure each test starts with a clean lazy client singleton and
    known-good settings, regardless of test execution order."""
    ai_service._client = None
    original_key = settings.openai_api_key
    original_retries = settings.ai_max_retries
    settings.openai_api_key = "test-key"
    settings.ai_max_retries = 1
    yield
    settings.openai_api_key = original_key
    settings.ai_max_retries = original_retries
    ai_service._client = None


def _patched_client(create_mock):
    client = MagicMock()
    client.chat.completions.create = create_mock
    return client


# ---------------------------------------------------------------------
# Case 1: normal complete ticket -> valid structured JSON (as a dict)
# ---------------------------------------------------------------------
def test_success_returns_plain_dict_not_triage_result():
    create_mock = MagicMock(return_value=_fake_response(VALID_RESULT))
    with patch.object(ai_service, "_get_client", return_value=_patched_client(create_mock)):
        result = call_triage_model("some ticket", [])

    assert isinstance(result, dict)
    assert result["category"] == "Network"
    assert create_mock.call_count == 1
    # Architectural boundary check: ai_service must NOT have imported or
    # constructed a TriageResult -- it only returns json.loads() output.
    assert "app.models" not in [
        type(result).__module__
    ]  # result is a plain dict, not a pydantic model instance


# ---------------------------------------------------------------------
# Cases 2 & 3 (shape passthrough only -- NOT a judgment test, see docstring)
# ---------------------------------------------------------------------
def test_ambiguous_ticket_shape_is_passed_through_unmodified():
    """Confirms ai_service does not second-guess or rewrite needs_follow_up
    / follow_up_question -- it's a pure pass-through of whatever the model
    returned. Whether the MODEL correctly recognizes 'The internet is
    down.' as ambiguous is a separate, live-API question."""
    create_mock = MagicMock(return_value=_fake_response(AMBIGUOUS_RESULT))
    with patch.object(ai_service, "_get_client", return_value=_patched_client(create_mock)):
        result = call_triage_model("The internet is down.", [])

    assert result["needs_follow_up"] is True
    assert result["follow_up_question"] is not None
    assert len(result["missing_information"]) > 0


def test_sufficient_ticket_shape_is_passed_through_unmodified():
    create_mock = MagicMock(return_value=_fake_response(VALID_RESULT))
    with patch.object(ai_service, "_get_client", return_value=_patched_client(create_mock)):
        result = call_triage_model(
            "My laptop is connected to Wi-Fi but I can't access any "
            "websites. Teams isn't working either. I have a client call "
            "in 20 minutes.",
            [],
        )

    assert result["needs_follow_up"] is False
    assert result["follow_up_question"] is None


# ---------------------------------------------------------------------
# Case 4: AI/API timeout -> retry -> AIServiceError
# ---------------------------------------------------------------------
def test_timeout_retries_then_raises_after_exhausting_attempts():
    create_mock = MagicMock(side_effect=ai_service.APITimeoutError("timed out"))
    with patch.object(ai_service, "_get_client", return_value=_patched_client(create_mock)):
        with pytest.raises(AIServiceError):
            call_triage_model("some ticket", [])

    # ai_max_retries=1 -> 2 total attempts (initial + 1 retry)
    assert create_mock.call_count == 2


def test_timeout_then_success_on_retry_recovers():
    create_mock = MagicMock(
        side_effect=[ai_service.APITimeoutError("timed out"), _fake_response(VALID_RESULT)]
    )
    with patch.object(ai_service, "_get_client", return_value=_patched_client(create_mock)):
        result = call_triage_model("some ticket", [])

    assert result["category"] == "Network"
    assert create_mock.call_count == 2


# ---------------------------------------------------------------------
# Case 5: invalid/malformed response -> retry -> AIServiceError
# ---------------------------------------------------------------------
def test_malformed_json_retries_then_raises():
    bad_response = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content="not valid json {{{"))]
    )
    create_mock = MagicMock(return_value=bad_response)
    with patch.object(ai_service, "_get_client", return_value=_patched_client(create_mock)):
        with pytest.raises(AIServiceError):
            call_triage_model("some ticket", [])

    assert create_mock.call_count == 2


# ---------------------------------------------------------------------
# Case 6: missing API key -> clean configuration error, no network call
# ---------------------------------------------------------------------
def test_missing_api_key_raises_immediately_without_calling_client():
    settings.openai_api_key = ""
    create_mock = MagicMock()
    with patch.object(ai_service, "_get_client", return_value=_patched_client(create_mock)):
        with pytest.raises(AIServiceError, match="OPENAI_API_KEY"):
            call_triage_model("some ticket", [])

    create_mock.assert_not_called()

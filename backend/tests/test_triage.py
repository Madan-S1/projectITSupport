"""
Integration tests for POST /api/triage, run against the real FastAPI app
via TestClient, for all 5 challenge sample tickets (tests/sample_tickets.json).

The AI call itself is mocked with a hand-crafted, plausible response per
ticket -- this test suite verifies OUR pipeline (route -> triage_service
-> validation_service -> response), not the live model's judgment. For
that, see scripts/verify_structured_output.py, which hits the real API.

Run with: pip install -r requirements.txt && pytest
"""

import json
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import triage_service

client = TestClient(app)

SAMPLE_TICKETS = json.loads(
    (Path(__file__).parent / "sample_tickets.json").read_text()
)["tickets"]

# Hand-crafted, schema-valid AI responses representative of what a
# well-behaved model should return for each sample ticket. Keyed by
# ticket id so each test can look up its own mock response.
MOCK_AI_RESPONSES = {
    "01_client_call": {
        "category": "Network",
        "priority": "Critical",
        "confidence": 0.85,
        "issue_summary": "Wi-Fi is connected but the device cannot reach any websites, and Teams is also failing.",
        "affected_component": "Wi-Fi / Teams",
        "urgency_factors": ["client call in 20 minutes"],
        "impact_indicators": ["multiple services affected (web browsing and Teams)"],
        "missing_information": [],
        "needs_follow_up": False,
        "follow_up_question": None,
        "recommended_action": "Check whether the laptop can reach a known external website (e.g. ping or browse to a well-known site).",
        "reason": "Wi-Fi connectivity is present but multiple internet-dependent services are failing, so testing raw external connectivity helps determine whether this is network-wide or app-specific.",
        "expected_observation": "If external websites also fail, the issue is likely broader network connectivity rather than Teams itself.",
        "possible_next_direction": "If external sites work, investigate Teams and DNS resolution specifically.",
    },
    "02_password_outlook": {
        "category": "Account",
        "priority": "Medium",
        "confidence": 0.8,
        "issue_summary": "Employee changed their password this morning; Windows login accepted it but Outlook keeps prompting for credentials.",
        "affected_component": "Outlook",
        "urgency_factors": [],
        "impact_indicators": ["single application affected"],
        "missing_information": [],
        "needs_follow_up": False,
        "follow_up_question": None,
        "recommended_action": "Update the stored credentials for this account in Windows Credential Manager, then restart Outlook.",
        "reason": "A password change often desyncs an app's cached credentials from the new password while the OS-level login already accepted it.",
        "expected_observation": "If updating stored credentials resolves the Outlook prompt, this confirms a cached-credential mismatch.",
        "possible_next_direction": "If the prompt persists, check whether the account requires re-authentication for MFA or a token refresh.",
    },
    "03_slow_laptop": {
        "category": "Device",
        "priority": "Low",
        "confidence": 0.55,
        "issue_summary": "Laptop has become extremely slow since this morning with only Chrome, Outlook and Teams open.",
        "affected_component": "Laptop",
        "urgency_factors": [],
        "impact_indicators": ["general performance degradation"],
        "missing_information": [],
        "needs_follow_up": False,
        "follow_up_question": None,
        "recommended_action": "Check Task Manager for processes with unusually high CPU or memory usage.",
        "reason": "With only a few lightweight apps open, high resource usage from an unexpected process is the most direct thing to rule in or out first.",
        "expected_observation": "If a specific process is consuming most of the CPU/memory, that narrows the cause; if usage looks normal, the cause is likely elsewhere (e.g. background updates).",
        "possible_next_direction": "If resource usage looks normal, check for pending OS/antivirus updates running in the background.",
    },
    "04_nothing_connecting": {
        "category": "Account",
        "priority": "Medium",
        "confidence": 0.3,
        "issue_summary": "Employee reports that 'nothing is connecting' since changing their password, with no further detail.",
        "affected_component": None,
        "urgency_factors": [],
        "impact_indicators": [],
        "missing_information": [
            "Which specific things aren't connecting (Wi-Fi, VPN, specific applications)",
            "Whether this is affecting only this device",
        ],
        "needs_follow_up": True,
        "follow_up_question": "Which specific things aren't connecting — Wi-Fi, VPN, or particular applications?",
        "recommended_action": "Gather more detail on what 'nothing is connecting' refers to before recommending a specific fix.",
        "reason": "The phrase is too broad to distinguish between a network issue, a VPN/auth issue, or multiple app-level credential issues stemming from the password change.",
        "expected_observation": "The employee's answer will indicate whether this is a network-layer or credential-layer problem.",
        "possible_next_direction": "Once scope is known, likely converges on either a network check or a credential-cache check similar to ticket 02.",
    },
    "05_internet_down": {
        "category": "Network",
        "priority": "Medium",
        "confidence": 0.3,
        "issue_summary": "Employee reports the internet is down, with no further detail provided.",
        "affected_component": None,
        "urgency_factors": [],
        "impact_indicators": [],
        "missing_information": [
            "Whether other employees nearby are also affected",
            "Whether the device is connected to Wi-Fi at all",
            "When the issue started",
        ],
        "needs_follow_up": True,
        "follow_up_question": "Are other employees nearby experiencing the same internet problem?",
        "recommended_action": "Confirm whether the issue is isolated to this employee or affecting others nearby before further diagnosis.",
        "reason": "A single-sentence report gives no information about scope, so the highest-value next step is determining whether this is an isolated or a shared outage.",
        "expected_observation": "If others are affected, this points to a broader network/ISP issue; if isolated, it points to this device's connection.",
        "possible_next_direction": "If isolated, check the device's own Wi-Fi/Ethernet connection next; if widespread, escalate as a possible outage.",
    },
}


@pytest.mark.parametrize("ticket", SAMPLE_TICKETS, ids=lambda t: t["id"])
def test_sample_ticket_returns_expected_shape(ticket):
    mock_response = MOCK_AI_RESPONSES[ticket["id"]]
    with patch.object(triage_service, "call_triage_model", return_value=mock_response):
        response = client.post("/api/triage", json={"message": ticket["message"]})

    assert response.status_code == 200
    body = response.json()

    assert body["category"] in ["Network", "Account", "Application", "Device", "Other"]
    assert body["priority"] in ["Low", "Medium", "High", "Critical"]
    assert 0.0 <= body["confidence"] <= 1.0
    assert body["needs_follow_up"] == ticket["expected_needs_follow_up"]

    if ticket["expected_needs_follow_up"]:
        assert body["follow_up_question"], "expected a follow-up question for an ambiguous ticket"
    else:
        assert body["follow_up_question"] is None
        assert body["recommended_action"], "expected a concrete recommendation for a sufficient ticket"


def test_ambiguous_ticket_end_to_end_does_not_fabricate_diagnosis():
    """The specific case called out in the challenge: 'The internet is
    down.' should never come back with a confident, specific diagnosis."""
    mock_response = MOCK_AI_RESPONSES["05_internet_down"]
    with patch.object(triage_service, "call_triage_model", return_value=mock_response):
        response = client.post("/api/triage", json={"message": "The internet is down."})

    body = response.json()
    assert body["needs_follow_up"] is True
    assert body["follow_up_question"] is not None
    assert body["confidence"] < 0.6


def test_ai_service_failure_returns_503_with_unavailable_body():
    """API-level check that a transport failure (AIServiceError) surfaces
    as 503 + TriageUnavailable, never a 200 with guessed data."""
    from app.services.ai_service import AIServiceError

    with patch.object(triage_service, "call_triage_model", side_effect=AIServiceError("boom")):
        response = client.post("/api/triage", json={"message": "The internet is down."})

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "unavailable"
    assert body["original_message"] == "The internet is down."
    assert "retryable" in body


def test_ai_output_invalid_after_retries_returns_503():
    """API-level check that a persistently invalid/malformed AI response
    (schema-invalid on every attempt) also surfaces as 503, not a 200
    with a corrupted or partially-guessed body."""
    with patch.object(triage_service, "call_triage_model", return_value={"not": "a valid schema"}):
        response = client.post("/api/triage", json={"message": "The internet is down."})

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "unavailable"


def test_empty_message_returns_422():
    response = client.post("/api/triage", json={"message": ""})
    assert response.status_code == 422


def test_whitespace_only_message_returns_422():
    response = client.post("/api/triage", json={"message": "     "})
    assert response.status_code == 422


def test_missing_message_field_returns_422():
    response = client.post("/api/triage", json={})
    assert response.status_code == 422


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

"""
Tests for app.services.validation_service, against the real TriageResult
(real pydantic). Run with: pip install -r requirements.txt && pytest
"""

import pytest
from pydantic import ValidationError

from app.models import TriageResult
from app.services.validation_service import (
    AIOutputInvalidError,
    check_semantic_consistency,
    parse_triage_result,
)

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


def test_parse_valid_raw_dict_succeeds():
    result = parse_triage_result(VALID_RAW)
    assert isinstance(result, TriageResult)
    assert result.category.value == "Network"


def test_parse_rejects_invalid_category():
    bad = {**VALID_RAW, "category": "Printer"}  # not in the allowed enum
    with pytest.raises(AIOutputInvalidError):
        parse_triage_result(bad)


def test_parse_rejects_invalid_priority():
    bad = {**VALID_RAW, "priority": "Urgent"}  # not in the allowed enum
    with pytest.raises(AIOutputInvalidError):
        parse_triage_result(bad)


def test_parse_rejects_confidence_below_zero():
    bad = {**VALID_RAW, "confidence": -0.1}
    with pytest.raises(AIOutputInvalidError):
        parse_triage_result(bad)


def test_parse_rejects_confidence_out_of_range():
    bad = {**VALID_RAW, "confidence": 1.5}
    with pytest.raises(AIOutputInvalidError):
        parse_triage_result(bad)


def test_parse_rejects_missing_required_field():
    bad = {k: v for k, v in VALID_RAW.items() if k != "reason"}
    with pytest.raises(AIOutputInvalidError):
        parse_triage_result(bad)


def test_parse_rejects_needs_follow_up_true_without_question():
    bad = {**VALID_RAW, "needs_follow_up": True, "follow_up_question": None}
    with pytest.raises(AIOutputInvalidError):
        parse_triage_result(bad)


def test_consistent_result_passes_semantic_check_unchanged():
    result = parse_triage_result(VALID_RAW)
    checked = check_semantic_consistency(result)
    assert checked.follow_up_question is None


def test_semantic_check_clears_stray_follow_up_question():
    raw = {**VALID_RAW, "follow_up_question": "stray question?"}
    result = parse_triage_result(raw)
    checked = check_semantic_consistency(result)
    assert checked.follow_up_question is None


def test_semantic_check_raises_on_missing_info_without_follow_up_flag():
    raw = {
        **VALID_RAW,
        "missing_information": ["whether other users are affected"],
        "needs_follow_up": False,
    }
    result = parse_triage_result(raw)
    with pytest.raises(AIOutputInvalidError):
        check_semantic_consistency(result)


def test_semantic_check_leaves_valid_follow_up_case_untouched():
    raw = {
        **VALID_RAW,
        "missing_information": ["whether other users are affected"],
        "needs_follow_up": True,
        "follow_up_question": "Are other employees affected too?",
    }
    result = parse_triage_result(raw)
    checked = check_semantic_consistency(result)
    assert checked.needs_follow_up is True
    assert checked.follow_up_question == "Are other employees affected too?"

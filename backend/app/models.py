"""
Pydantic models for ITriage.

These models serve THREE purposes with a single source of truth:
1. FastAPI request validation (what the frontend sends us)
2. FastAPI response contract (what the frontend receives)
3. AI output validation (what we require the OpenAI response to conform to)

This is the core of "never depend on free-form AI text for core logic" —
the raw JSON string returned by the model gets parsed directly into
TriageResult. If the AI omits a required field, uses a value outside an
enum, or puts confidence outside [0, 1], parsing fails immediately and
predictably, instead of corrupting the UI with garbage.

TriageResult also encodes a strict separation between diagnosis,
uncertainty, and action, so these are never blended into one another:
  - issue_summary          -> what can reasonably be concluded from the
                               evidence actually provided (diagnosis)
  - missing_information    -> what is unknown but relevant (uncertainty)
  - recommended_action /
    follow_up_question     -> what to do next (action), gated on whether
                               the evidence available supports a useful
                               diagnostic step
A recommendation is a suggested next diagnostic step, never a confirmed
root cause -- see the reason/expected_observation fields, which frame the
recommendation as a hypothesis to test, not a conclusion.
"""

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
# Using str Enums (not free-text strings) means FastAPI/Pydantic reject any
# category or priority the AI or the client invents that isn't one of these
# exact values. This is what "Allowed category values" / "Allowed priority
# values" from the spec becomes in code, rather than a comment.

class Category(str, Enum):
    NETWORK = "Network"
    ACCOUNT = "Account"
    APPLICATION = "Application"
    DEVICE = "Device"
    OTHER = "Other"


class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


# ---------------------------------------------------------------------------
# Conversation context (for follow-up re-analysis)
# ---------------------------------------------------------------------------

class FollowUpExchange(BaseModel):
    """One question-answer pair from a prior round of triage."""
    question: str
    answer: str


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class TriageRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="The employee's IT support request, in their own words.",
    )
    # Populated only on a follow-up re-analysis call. Empty/omitted on the
    # first analysis of a ticket. The frontend owns this list; the backend
    # is stateless and never persists it.
    conversation_history: List[FollowUpExchange] = Field(default_factory=list)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message must not be blank or whitespace-only")
        return v.strip()


# ---------------------------------------------------------------------------
# AI output / API response
# ---------------------------------------------------------------------------
# This is the schema we both (a) instruct the AI to fill via structured
# output / function calling, and (b) validate its raw JSON against.
# It is also exactly what /api/triage returns on success, so the frontend
# and the AI contract are the same object.

class TriageResult(BaseModel):
    category: Category
    priority: Priority
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model's confidence in this classification, 0-1.",
    )
    issue_summary: str = Field(
        ...,
        min_length=1,
        description=(
            "What can reasonably be concluded from the evidence the employee "
            "provided. Must not assert an unstated root cause."
        ),
    )
    affected_component: Optional[str] = Field(
        default=None,
        description="Specific service/app/device named or implied, e.g. 'Wi-Fi', 'Outlook'.",
    )
    urgency_factors: List[str] = Field(
        default_factory=list,
        description="Business/time-sensitivity signals, e.g. 'client call in 20 minutes'.",
    )
    impact_indicators: List[str] = Field(
        default_factory=list,
        description="Scope/severity signals, e.g. 'multiple services affected'.",
    )
    missing_information: List[str] = Field(
        default_factory=list,
        description="What is unknown but relevant to a reliable diagnosis.",
    )
    needs_follow_up: bool
    follow_up_question: Optional[str] = Field(
        default=None,
        description="Single highest-value question. Present only if needs_follow_up is true.",
    )
    recommended_action: str = Field(
        ...,
        min_length=1,
        description=(
            "A next diagnostic step, provided only when the available "
            "information supports a genuinely useful one. When evidence is "
            "thin (needs_follow_up=True), this should be conservative -- "
            "e.g. framed as gathering the missing information itself -- "
            "rather than a specific fix, and must never read as a "
            "confirmed root cause."
        ),
    )
    reason: str = Field(..., min_length=1)
    expected_observation: str = Field(..., min_length=1)
    possible_next_direction: str = Field(..., min_length=1)

    @field_validator("follow_up_question")
    @classmethod
    def question_required_when_follow_up_needed(cls, v, info):
        # Defensive validation, not a default: if needs_follow_up is True
        # but the AI didn't supply a question, we do NOT invent one here.
        # We raise, so triage_service treats this as an invalid AI response
        # and falls back accordingly (see AI Failure Fallback in Phase 1).
        needs_follow_up = info.data.get("needs_follow_up")
        if needs_follow_up and not v:
            raise ValueError(
                "follow_up_question is required when needs_follow_up is true"
            )
        return v


# ---------------------------------------------------------------------------
# Failure fallback
# ---------------------------------------------------------------------------
# Deliberately a DIFFERENT shape than TriageResult, not TriageResult with
# blank/guessed fields. This makes it structurally impossible for the
# frontend to accidentally render a fabricated diagnosis as if it were a
# real one — the two response types are distinguishable by their schema,
# not by inspecting field values.

class TriageUnavailable(BaseModel):
    status: str = "unavailable"
    original_message: str
    detail: str = "Automated analysis is temporarily unavailable. Please try again."
    retryable: bool = True


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str = "ok"

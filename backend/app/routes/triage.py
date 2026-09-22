"""
/api/triage route.

Deliberately thin: parse request (FastAPI + TriageRequest already does
this), call triage_service.analyze_ticket, and translate its return type
into an HTTP response. No business logic lives here.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models import TriageRequest, TriageResult, TriageUnavailable
from app.services.triage_service import analyze_ticket

router = APIRouter()


@router.post(
    "/triage",
    response_model=TriageResult,
    responses={503: {"model": TriageUnavailable}},
)
def triage_ticket(payload: TriageRequest):
    """
    Analyze an IT support ticket (or re-analyze one with follow-up
    context in payload.conversation_history).

    Returns 200 with a TriageResult on success. Returns 503 with a
    TriageUnavailable body -- never a 200 with guessed data, and never an
    unhandled 500 -- when the AI call fails or its output can't be
    trusted after retries. Input validation errors (empty message, over
    the length limit) are handled automatically by FastAPI/Pydantic via
    TriageRequest and surface as 422, before this function even runs.
    """
    result = analyze_ticket(payload)

    if isinstance(result, TriageUnavailable):
        # A distinct response shape at a distinct status code, so the
        # frontend can't mistake "automated analysis unavailable" for a
        # sparse-but-real TriageResult.
        return JSONResponse(status_code=503, content=result.model_dump())

    return result

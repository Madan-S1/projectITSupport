"""
FastAPI application entrypoint.

Kept deliberately thin: app setup, middleware, and route registration only.
Business logic lives in services/, not here. The /api/triage route itself
is added in Phase 4 once ai_service.py and triage_service.py exist.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import HealthResponse
from app.routes import triage

app = FastAPI(
    title="ITriage API",
    description="AI-Powered IT Support Triage Assistant",
    version="0.1.0",
)

# The React dev server (Vite) runs on a different origin than FastAPI, so
# CORS must be explicitly allowed. Configurable via ALLOWED_ORIGINS so a
# production deployment isn't stuck with the dev-server origin hardcoded
# into source -- restricted to explicit origins rather than "*" either way.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Liveness check. Deliberately does NOT check the AI provider's
    reachability — that's a separate concern handled per-request by
    ai_service.py's own timeout/retry/fallback logic (Phase 3-4)."""
    return HealthResponse()


app.include_router(triage.router, prefix="/api")

"""
Centralized configuration, loaded from environment variables.

Keeping this in one place (rather than scattering os.environ calls through
the codebase) means there's exactly one spot to check when explaining
"where does the API key come from and who can see it" in an interview:
it's read here, held in memory on the backend process, and never returned
in any API response or sent to the frontend.
"""

import os

from dotenv import load_dotenv

# Loads backend/.env into the process environment (if present) BEFORE
# Settings reads os.environ below. Without this, following the README's
# own setup instructions (cp .env.example .env, edit .env) would silently
# do nothing -- uvicorn does not read .env files on its own.
load_dotenv()


class Settings:
    openai_api_key: str = os.environ.get("OPENAI_API_KEY", "")
    openai_model: str = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    openai_base_url: str | None = os.environ.get("OPENAI_BASE_URL", "").strip() or None

    # Applied in ai_service.py. A hiring-challenge app should fail fast
    # rather than hang, so the retry/timeout behavior is deliberately tight.
    ai_request_timeout_seconds: float = float(
        os.environ.get("AI_REQUEST_TIMEOUT_SECONDS", "15")
    )
    ai_max_retries: int = int(os.environ.get("AI_MAX_RETRIES", "1"))

    max_message_length: int = int(os.environ.get("MAX_MESSAGE_LENGTH", "4000"))

    # Comma-separated list of allowed frontend origins for CORS. Defaults
    # to the Vite dev server so `npm run dev` works out of the box; set
    # this explicitly in production rather than hardcoding a deployed
    # frontend's URL into source.
    allowed_origins: list = [
        o.strip()
        for o in os.environ.get(
            "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if o.strip()
    ]

    def is_configured(self) -> bool:
        """False when no API key is present — used to fail gracefully at
        request time (see Edge Cases: 'Missing API key') instead of the
        process crashing at startup, which would give a worse error to
        whoever is evaluating the app.
        """
        return bool(self.openai_api_key)


settings = Settings()

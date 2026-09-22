# ITriage — AI-Powered IT Support Triage Assistant

## 1. Problem statement

IT support teams receive short, often incomplete requests ("The internet is down.", "Nothing is connecting since I changed my password.") and have to quickly figure out three things: what's actually wrong, how urgent it really is, and what to do next — without over-committing to a diagnosis the evidence doesn't support. Doing this well, consistently, at ticket volume, is exactly the kind of judgment task that's tedious for humans to do from scratch every time but risky to automate carelessly, because a confidently wrong first move wastes more time than it saves.

## 2. Solution overview

ITriage reads one employee ticket at a time and produces a structured triage assessment: category, priority, a plain-language issue summary, what's still unknown, and a next diagnostic step — or, when the ticket doesn't contain enough to safely recommend one, a single high-value follow-up question instead. The person can answer that question in the same UI, and the ticket is re-analyzed with the new context.

The central design commitment, driven by the challenge's own emphasis: **the system must never present a guess as a fact.** Every layer of the architecture — the prompt, the schema, the backend's validation, the UI — exists to enforce that, not just the prompt wording.

## 3. Key features

- Structured triage of a raw support ticket: category, priority, confidence, issue summary, affected component
- Explicit separation of what's missing vs. what's known, with exactly one prioritized follow-up question when evidence is thin
- A conservative, evidence-grounded next diagnostic step and the reasoning behind it, never a claimed root cause
- A simple follow-up conversation loop that re-analyzes the ticket with the added context
- Graceful degradation — the app tells you plainly when automated analysis isn't available, and never fills in a guess to look complete

## 4. AI features

**1. Intelligent ticket triage** — extracts category, priority, issue summary, confidence, affected component, and separates urgency signals (business impact, deadlines) from impact signals (scope, number of services affected), rather than inferring priority from category alone.

**2. Missing information + follow-up** — decides whether the ticket has enough evidence for a useful recommendation. If not, it names what's missing and asks exactly one prioritized question — never a checklist.

**3. AI troubleshooting recommendation** — a next diagnostic step (not a fix, not a diagnosis), the reasoning behind it, what result would confirm or rule it out, and a fallback direction if it doesn't.

All three run through the model as **one structured call**, not three separate ones — a single prompt produces a schema-validated JSON object covering all three concerns together, since they're not actually independent (whether you can recommend an action depends on whether you have enough information, which depends on the same evidence read for the category/priority extraction).

## 5. Architecture

```
React Frontend (Vite + Tailwind)
       |
       | HTTP/JSON  ->  POST /api/triage
       ↓
FastAPI Backend (routes/triage.py)
       |
       ↓
Triage Service (orchestrator)
       |
       ├── AI Service ────────────► OpenAI (structured output, timeout + retry)
       |        │
       |        ▼
       |   plain dict (unvalidated)
       |        │
       ├── Validation Service
       |        ├── schema check (Pydantic TriageResult)
       |        └── semantic consistency check
       |        │
       |        ▼
       |   TriageResult  (or: retry once, then TriageUnavailable)
       ↓
Structured JSON Response
       ↓
React UI (category/priority/confidence, missing info + follow-up,
          recommendation + reasoning)
```

**Why this shape, specifically:** `ai_service.py` returns a **plain dict**, never a validated model — it doesn't get to decide what "valid" means for the business. That decision lives entirely in `validation_service.py` and `triage_service.py`. This mattered enough during development that it was an explicit design constraint: don't let the AI layer creep into owning business validation just because it's convenient to parse the model's JSON straight into a Pydantic object at the point of the API call.

Two retry loops exist, deliberately kept separate:
- `ai_service.py` retries on **transport** failures (timeout, API error, unparseable JSON) — this is about talking to OpenAI reliably.
- `triage_service.py` retries once more on **semantic** invalidity (schema-valid but internally contradictory output) — this is a business decision about trusting the model's judgment, not a networking concern.

Both paths that exhaust their retries converge on the same outcome: a `TriageUnavailable` response, which is a **structurally different shape** than `TriageResult` — not a `TriageResult` with blank or guessed fields. This makes it impossible for the frontend to accidentally render a fabricated diagnosis as if it were real; it would have to actively misread which type it got.

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind | Fast dev loop, component-level structure suits a page with distinct result sections, Tailwind keeps styling co-located and consistent without a separate CSS architecture |
| Backend | FastAPI + Pydantic | Pydantic gives one schema definition reused three ways: API request validation, API response contract, and AI output validation — the same `TriageResult` class does all three, so a malformed AI response fails loudly and immediately instead of corrupting the UI |
| AI | OpenAI API, structured output (`response_format=json_schema`, strict mode) | Enforces category/priority enums and required fields at the API boundary, not just via prompt instruction |
| Testing | Pytest (backend), Vitest + Testing Library (frontend) | Standard, well-understood tooling; no exotic test infra for a project this size |
| No database | — | Each ticket is a self-contained, stateless analysis; the only "state" is a short follow-up conversation held in the browser for the current ticket. Adding a database would solve a persistence problem this app doesn't have |

## 7. Project structure

```
itriage/
  backend/
    app/
      main.py                    # FastAPI app, CORS, route registration
      models.py                  # Category/Priority enums, TriageRequest,
                                  # TriageResult, TriageUnavailable, HealthResponse
      config.py                  # Settings from environment variables
      routes/
        triage.py                # POST /api/triage
      services/
        ai_service.py            # OpenAI call: schema, timeout, transport retry
        triage_service.py        # Orchestrator: semantic retry, fallback ownership
        validation_service.py    # Schema validation + semantic consistency checks
      prompts/
        triage_prompt.py         # System prompt + follow-up context assembly
    scripts/
      verify_structured_output.py  # Manual live-model check (needs a real API key)
    tests/
      test_ai_service.py
      test_validation_service.py
      test_triage_service.py
      test_triage.py             # Full API integration tests, all 5 sample tickets
      sample_tickets.json
    requirements.txt
    .env.example
  frontend/
    src/
      main.jsx, App.jsx, index.css
      pages/
        TriagePage.jsx           # Owns ticket/conversation/result/error state
      components/
        Header.jsx, TicketInputPanel.jsx, TriageOverview.jsx,
        PriorityBadge.jsx, MissingInfoPanel.jsx, RecommendationPanel.jsx,
        ErrorBanner.jsx
      services/
        api.js                   # Only module that knows the backend's HTTP contract
      test/setup.js
    vite.config.js, vitest.config.js, tailwind.config.js
    package.json
  README.md
```

## 8. Environment setup

Requires **Python 3.10+** (the backend uses `X | None` union-type syntax) and **Node 18+** (required by Vite 5).

```
cd backend
cp .env.example .env
# edit .env and set OPENAI_API_KEY=sk-...
```

`.env` is loaded automatically at startup via `python-dotenv` — you don't need to `export` it manually. It's git-ignored; never commit it.

`ALLOWED_ORIGINS` in `.env` controls CORS and defaults to the Vite dev server origins, so local development works with no configuration. Set it explicitly to your deployed frontend's URL in production.

## 9. Installation

```
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

## 10. Running the backend

```
cd backend
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/api/health` → `{"status": "ok"}`

## 11. Running the frontend

```
cd frontend
npm run dev
```

Opens on `http://localhost:5173`. The Vite dev server proxies `/api/*` to `http://localhost:8000`, so no CORS configuration is needed in dev beyond what's already in `main.py`.

## 12. API documentation

### `POST /api/triage`

Request:
```json
{
  "message": "The internet is down.",
  "conversation_history": []
}
```

`conversation_history` is optional (defaults to `[]`) and is only populated by the frontend on a follow-up re-analysis — each entry is `{"question": "...", "answer": "..."}`.

Response — `200 OK` (successful analysis):
```json
{
  "category": "Network",
  "priority": "Medium",
  "confidence": 0.3,
  "issue_summary": "Employee reports the internet is down, with no further detail provided.",
  "affected_component": null,
  "urgency_factors": [],
  "impact_indicators": [],
  "missing_information": [
    "Whether other employees nearby are also affected",
    "Whether the device is connected to Wi-Fi at all",
    "When the issue started"
  ],
  "needs_follow_up": true,
  "follow_up_question": "Are other employees nearby experiencing the same internet problem?",
  "recommended_action": "Confirm whether the issue is isolated to this employee or affecting others nearby before further diagnosis.",
  "reason": "A single-sentence report gives no information about scope, so the highest-value next step is determining whether this is an isolated or a shared outage.",
  "expected_observation": "If others are affected, this points to a broader network/ISP issue; if isolated, it points to this device's connection.",
  "possible_next_direction": "If isolated, check the device's own Wi-Fi/Ethernet connection next; if widespread, escalate as a possible outage."
}
```

Response — `503 Service Unavailable` (AI call failed, or its output couldn't be trusted after a retry):
```json
{
  "status": "unavailable",
  "original_message": "The internet is down.",
  "detail": "Automated analysis is temporarily unavailable. Please try again.",
  "retryable": true
}
```

Input validation errors (empty or whitespace-only message, over 4000 characters) return `422` automatically via FastAPI/Pydantic, before any AI call is made.

### `GET /api/health`
```json
{"status": "ok"}
```

## 13. Example ticket and response

**Sufficient evidence** — direct recommendation, no follow-up:

Ticket: *"My laptop is connected to Wi-Fi but I can't access any websites. Teams isn't working either. I have a client call in 20 minutes."*

```json
{
  "category": "Network",
  "priority": "Critical",
  "confidence": 0.85,
  "issue_summary": "Wi-Fi is connected but the device cannot reach any websites, and Teams is also failing.",
  "affected_component": "Wi-Fi / Teams",
  "urgency_factors": ["client call in 20 minutes"],
  "impact_indicators": ["multiple services affected (web browsing and Teams)"],
  "missing_information": [],
  "needs_follow_up": false,
  "follow_up_question": null,
  "recommended_action": "Check whether the laptop can reach a known external website.",
  "reason": "Wi-Fi connectivity is present but multiple internet-dependent services are failing, so testing raw external connectivity helps determine whether this is network-wide or app-specific.",
  "expected_observation": "If external websites also fail, the issue is likely broader network connectivity rather than Teams itself.",
  "possible_next_direction": "If external sites work, investigate Teams and DNS resolution specifically."
}
```

See section 12 above for the ambiguous case ("The internet is down.").

## 14. Testing

**Backend** (`cd backend && pytest`):
- `test_ai_service.py` — OpenAI call control flow: success, timeout + retry, malformed JSON, missing API key
- `test_validation_service.py` — schema validation (category/priority enums, confidence bounds, required fields, the `needs_follow_up`/question cross-check) and semantic consistency checks
- `test_triage_service.py` — orchestration: transport failure → immediate fallback, schema-invalid → one retry → fallback, semantic inconsistency → retry → recovery
- `test_triage.py` — full API integration via `TestClient`, covering all 5 challenge sample tickets plus empty/whitespace/missing-field input and the health check

**Live model check** (`python -m scripts.verify_structured_output`, needs a real `OPENAI_API_KEY`): runs the 5 sample tickets against the actual model and specifically flags it if an ambiguous ticket (like "The internet is down.") gets a confident diagnosis instead of a follow-up question. The pytest suite proves the *pipeline* handles good and bad AI output correctly; only this script proves the *model itself* makes the right call.

**Frontend** (`cd frontend && npm test`): component tests for the input panel, the missing-info/follow-up panel, and the error banner, plus tests for the API service layer (success, 503, 422, and network-failure handling).

## 15. AI design decisions

- **One structured call, not three** — the three "AI features" aren't independent; whether a follow-up question is needed depends on the same evidence that drives category/priority, so splitting them into separate calls would mean re-deriving the same read of the ticket multiple times and risking them disagreeing with each other.
- **Structured output over free text** — free text needs fragile parsing to drive UI logic (e.g., coloring a priority badge) and gives the model room to hedge past the schema. `response_format=json_schema` in strict mode constrains it at the API level.
- **Evidence vs. inference vs. unknown, enforced in three places** — the prompt instructs it, the `TriageResult` schema's field descriptions state it (`issue_summary` "must not assert an unstated root cause"), and `validation_service.py`'s semantic check catches the one contradiction a single-field validator can't see (missing information listed but no follow-up flagged).
- **Confidence reflects evidence quality, not guess-plausibility** — the prompt explicitly separates these, because a model can be fluent and specific about a guess without it being well-evidenced.
- **Two independent retry mechanisms** — transport retries (`ai_service.py`) and semantic-validity retries (`triage_service.py`) are different failure classes with different owners; conflating them would mean the networking layer silently absorbing a business judgment about output trustworthiness.
- **`TriageUnavailable` is a distinct type, not a degraded `TriageResult`** — this is a schema-level guarantee against showing a fabricated diagnosis, not just a convention the code happens to follow.
- **The AI never proposes taking action itself** — the prompt explicitly scopes it to recommending what a human should check or do next; ITriage classifies and advises, it doesn't remediate (see Limitations).

## 16. Limitations

- **No persistence** — there's no database; a ticket's follow-up conversation lives only in the browser tab's memory and is lost on refresh. There's no ticket history, no multi-session conversation, no audit log.
- **Single-user, no auth** — there's no login, no per-agent tracking of who triaged what.
- **One follow-up question at a time, one round-trip modeled explicitly** — the architecture supports re-analyzing with arbitrarily long conversation history, but the UI only exercises a single question → answer → re-analysis loop; a ticket needing two rounds of clarification works mechanically but hasn't been polished for that flow.
- **Verification gap between pipeline and model** — the automated test suite proves the code handles good and bad AI output correctly using mocked responses; it does not continuously verify the live model's judgment (e.g., that a new prompt revision still correctly flags "The internet is down." as ambiguous). That requires periodically re-running `scripts/verify_structured_output.py` against the real API.
- **English-only prompt and UI** — no localization.
- **No rate limiting or abuse protection** on the `/api/triage` endpoint itself, beyond FastAPI/Pydantic's input validation.

## 17. Future improvements

- Persist tickets and their resolutions (with a database) to let IT teams review triage history and measure how often the AI's recommendation actually resolved the issue
- Integrate with a real ticketing system (Jira Service Management, ServiceNow, Zendesk) instead of a standalone form
- Multi-turn follow-up UI polish (numbered question sequence, ability to go back)
- Feed resolved-ticket outcomes back into prompt refinement over time
- Streaming the AI response so the UI can show partial results (e.g., category/priority) before the full recommendation finishes generating
- Basic auth/session support so multiple support agents can use the same deployment with separate ticket queues

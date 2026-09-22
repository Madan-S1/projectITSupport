/**
 * The only module that knows the backend's HTTP contract. Components
 * never call fetch() directly -- this keeps the request/response shape
 * (and the 503-vs-200 distinction from the backend's TriageUnavailable
 * design) in exactly one place.
 */

const BASE_URL = "/api";

export class TriageUnavailableError extends Error {
  constructor(detail, retryable) {
    super(detail);
    this.name = "TriageUnavailableError";
    this.retryable = retryable;
  }
}

/**
 * Analyze a ticket, optionally with prior follow-up Q&A context for a
 * re-analysis. Returns the parsed TriageResult JSON on success.
 *
 * Throws TriageUnavailableError when the backend returns 503 (AI call
 * failed or its output couldn't be trusted) -- callers show a distinct
 * "try again" state, never a guessed result. Throws a plain Error for
 * validation failures (422) or network issues.
 */
export async function analyzeTicket(message, conversationHistory = []) {
  let response;
  try {
    response = await fetch(`${BASE_URL}/triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
      }),
    });
  } catch {
    throw new Error(
      "Couldn't reach the server. Check your connection and try again."
    );
  }

  if (response.status === 503) {
    const body = await response.json().catch(() => ({}));
    throw new TriageUnavailableError(
      body.detail ||
        "Automated analysis is temporarily unavailable. Please try again.",
      body.retryable !== false
    );
  }

  if (response.status === 422) {
    const body = await response.json().catch(() => ({}));
    const firstError = body?.detail?.[0]?.msg;
    throw new Error(firstError || "That request wasn't valid. Check the ticket text.");
  }

  if (!response.ok) {
    throw new Error(`Unexpected server error (${response.status}).`);
  }

  return response.json();
}

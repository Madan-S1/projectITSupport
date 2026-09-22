import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeTicket, TriageUnavailableError } from "../services/api.js";

function mockFetchOnce({ status, body }) {
  global.fetch = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

describe("analyzeTicket", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the parsed TriageResult on a 200 response", async () => {
    const mockResult = { category: "Network", priority: "High", needs_follow_up: false };
    mockFetchOnce({ status: 200, body: mockResult });

    const result = await analyzeTicket("The internet is down.", []);

    expect(result).toEqual(mockResult);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/triage",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "The internet is down.",
          conversation_history: [],
        }),
      })
    );
  });

  it("throws TriageUnavailableError with the backend's detail on a 503", async () => {
    mockFetchOnce({
      status: 503,
      body: {
        status: "unavailable",
        original_message: "x",
        detail: "Automated analysis is temporarily unavailable.",
        retryable: true,
      },
    });

    await expect(analyzeTicket("x", [])).rejects.toThrow(TriageUnavailableError);
    await expect(analyzeTicket("x", [])).rejects.toThrow(
      "Automated analysis is temporarily unavailable."
    );
  });

  it("marks a non-retryable 503 accordingly", async () => {
    mockFetchOnce({
      status: 503,
      body: { detail: "Cannot process this ticket.", retryable: false },
    });

    try {
      await analyzeTicket("x", []);
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(TriageUnavailableError);
      expect(err.retryable).toBe(false);
    }
  });

  it("surfaces the backend's validation message on a 422", async () => {
    mockFetchOnce({
      status: 422,
      body: { detail: [{ msg: "message must not be blank or whitespace-only" }] },
    });

    await expect(analyzeTicket("", [])).rejects.toThrow(
      "message must not be blank or whitespace-only"
    );
  });

  it("throws a generic error when fetch itself fails (network down)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(analyzeTicket("x", [])).rejects.toThrow(/couldn't reach the server/i);
  });

  it("sends conversation_history for a follow-up re-analysis", async () => {
    mockFetchOnce({ status: 200, body: { needs_follow_up: false } });
    const history = [{ question: "Are others affected?", answer: "No, only me." }];

    await analyzeTicket("The internet is down.", history);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/triage",
      expect.objectContaining({
        body: JSON.stringify({
          message: "The internet is down.",
          conversation_history: history,
        }),
      })
    );
  });
});

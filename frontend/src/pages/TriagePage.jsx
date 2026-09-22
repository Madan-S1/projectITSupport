import { useState, useRef } from "react";
import TicketInputPanel from "../components/TicketInputPanel.jsx";
import TriageOverview from "../components/TriageOverview.jsx";
import MissingInfoPanel from "../components/MissingInfoPanel.jsx";
import RecommendationPanel from "../components/RecommendationPanel.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { analyzeTicket, TriageUnavailableError } from "../services/api.js";

export default function TriagePage() {
  const [draftMessage, setDraftMessage] = useState("");
  const [originalMessage, setOriginalMessage] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const retryActionRef = useRef(null);

  const runAnalysis = async (message, history) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeTicket(message, history);
      setOriginalMessage(message);
      setConversationHistory(history);
      setResult(data);
    } catch (err) {
      const retryable =
        err instanceof TriageUnavailableError ? err.retryable : true;
      setError({ message: err.message, retryable });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = () => {
    const message = draftMessage.trim();
    retryActionRef.current = () => runAnalysis(message, []);
    runAnalysis(message, []);
  };

  const handleFollowUpAnswer = (answer) => {
    const nextHistory = [
      ...conversationHistory,
      { question: result.follow_up_question, answer },
    ];
    retryActionRef.current = () => runAnalysis(originalMessage, nextHistory);
    runAnalysis(originalMessage, nextHistory);
  };

  const handleRetry = () => {
    if (retryActionRef.current) retryActionRef.current();
  };

  const handleStartNew = () => {
    setDraftMessage("");
    setOriginalMessage(null);
    setConversationHistory([]);
    setResult(null);
    setError(null);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      {!originalMessage && (
        <TicketInputPanel
          message={draftMessage}
          onMessageChange={setDraftMessage}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />
      )}

      {originalMessage && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700 text-xs font-bold">
                🎫
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                Submitted Support Request
              </span>
            </div>
            <button
              type="button"
              onClick={handleStartNew}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-semibold text-slate-600 hover:border-sky-500 hover:text-sky-600 active:scale-95 transition-all duration-150"
            >
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Start new ticket
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50/80 p-4 border border-slate-100">
            <p className="text-sm font-medium leading-relaxed text-slate-800">
              "{originalMessage}"
            </p>
          </div>

          {conversationHistory.length > 0 && (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Follow-up Clarifications Log
              </div>
              {conversationHistory.map((exchange, i) => (
                <div key={i} className="rounded-xl border border-sky-100 bg-sky-50/40 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                    <span>Q:</span>
                    <span>{exchange.question}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 pl-4 border-l-2 border-sky-400">
                    <span>A:</span>
                    <span>{exchange.answer}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div aria-live="polite">
        {error && (
          <ErrorBanner
            message={error.message}
            retryable={error.retryable}
            onRetry={handleRetry}
          />
        )}

        {isLoading && !result && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-card">
            <svg className="h-6 w-6 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-mono text-sm font-semibold text-slate-700">
              Analyzing ticket evidence and running diagnostic reasoning…
            </span>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-6 motion-safe:animate-fadein">
          <TriageOverview result={result} />
          <MissingInfoPanel
            result={result}
            onSubmitAnswer={handleFollowUpAnswer}
            isLoading={isLoading}
          />
          <RecommendationPanel result={result} />
        </div>
      )}
    </main>
  );
}

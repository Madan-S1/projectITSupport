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
    <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      {!originalMessage && (
        <TicketInputPanel
          message={draftMessage}
          onMessageChange={setDraftMessage}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />
      )}

      {originalMessage && (
        <section className="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 text-sm">
                🎫
              </div>
              <div>
                <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Active Support Ticket #TKG-8902
                </span>
                <span className="ml-2 font-mono text-[10px] text-slate-500">PROCESSED</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleStartNew}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2 font-mono text-xs font-bold text-slate-200 hover:border-sky-500 hover:text-sky-300 active:scale-95 transition-all duration-150"
            >
              <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Start new ticket
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-950/80 p-5 border border-slate-800/80 shadow-inner">
            <p className="font-sans text-base font-semibold leading-relaxed text-slate-100">
              "{originalMessage}"
            </p>
          </div>

          {conversationHistory.length > 0 && (
            <div className="mt-5 space-y-3.5 border-t border-slate-800/80 pt-4">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                Follow-up Evidence Log
              </div>
              {conversationHistory.map((exchange, i) => (
                <div key={i} className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400 font-mono">
                    <span>Q:</span>
                    <span>{exchange.question}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-100 pl-4 border-l-2 border-sky-400">
                    <span className="font-bold text-sky-300">A:</span>
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
          <div className="glass-panel relative overflow-hidden rounded-3xl p-10 shadow-2xl text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-neonSky">
                <svg className="h-7 w-7 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-mono text-base font-bold text-white tracking-wide">
                Analyzing Ticket Evidence…
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-mono">
                Executing single-pass structured schema inference & validation check
              </p>
            </div>
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

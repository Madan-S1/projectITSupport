import { useState } from "react";

export default function MissingInfoPanel({ result, onSubmitAnswer, isLoading }) {
  const [answer, setAnswer] = useState("");

  if (!result.needs_follow_up && result.missing_information.length === 0) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim() && !isLoading) {
      onSubmitAnswer(answer.trim());
      setAnswer("");
    }
  };

  return (
    <section className="glass-panel relative overflow-hidden rounded-3xl border-amber-500/40 bg-amber-950/20 p-6 shadow-2xl transition-all duration-300">
      {result.needs_follow_up && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-amber-500/10 p-4 border border-amber-500/30 text-amber-300 shadow-neonAmber">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold text-lg">
            ⚠️
          </div>
          <div>
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-amber-400">
              More Information Required
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80 font-medium">
              Evidence in initial ticket is insufficient for a confident diagnostic step. Follow-up required.
            </p>
          </div>
        </div>
      )}

      {result.missing_information.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
            Information Needed
          </div>
          <ul className="mt-3 space-y-2">
            {result.missing_information.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                  ?
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.needs_follow_up && result.follow_up_question && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-2xl border border-sky-500/30 bg-slate-950/80 p-4 shadow-inner">
          <label htmlFor="follow-up-answer" className="flex items-center gap-2 text-sm font-bold text-white tracking-tight">
            <span className="text-sky-400">💬</span>
            {result.follow_up_question}
          </label>
          <div className="mt-3 flex gap-2">
            <input
              id="follow-up-answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isLoading}
              maxLength={1000}
              placeholder="Type your answer…"
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/20 disabled:opacity-50 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!answer.trim() || isLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 font-mono text-xs font-bold text-white shadow-neonSky hover:from-sky-400 hover:to-blue-500 active:scale-95 disabled:opacity-40 whitespace-nowrap transition-all duration-200"
            >
              {isLoading ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

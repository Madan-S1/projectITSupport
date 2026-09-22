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
    <section className="overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/30 p-6 shadow-card transition-all duration-200">
      {result.needs_follow_up && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-amber-800">
          <svg className="h-5 w-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-700">
              More information required
            </p>
            <p className="text-xs text-amber-800/80">
              Further evidence is needed before issuing a specific diagnostic recommendation.
            </p>
          </div>
        </div>
      )}

      {result.missing_information.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
            Information Needed
          </div>
          <ul className="mt-3 space-y-2">
            {result.missing_information.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-800">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                  ?
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.needs_follow_up && result.follow_up_question && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <label htmlFor="follow-up-answer" className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
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
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!answer.trim() || isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 active:scale-95 disabled:opacity-40 whitespace-nowrap transition-all duration-200"
            >
              {isLoading ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

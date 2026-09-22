import PriorityBadge from "./PriorityBadge.jsx";

const CATEGORY_ICONS = {
  Network: "🌐",
  Application: "💻",
  Account: "🔑",
  Device: "🖥️",
  Other: "⚙️",
};

function Field({ label, children }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-inner">
      <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-2.5">{children}</div>
    </div>
  );
}

export default function TriageOverview({ result }) {
  const confidencePct = Math.round(result.confidence * 100);
  const icon = CATEGORY_ICONS[result.category] || "📋";

  const getConfidenceBarColor = (pct) => {
    if (pct >= 70) return "bg-emerald-400 shadow-neonEmerald";
    if (pct >= 40) return "bg-sky-400 shadow-neonSky";
    return "bg-amber-400 shadow-neonAmber";
  };

  return (
    <section className="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono text-xs font-bold">
            01
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              Diagnostic Assessment Overview
            </h2>
            <p className="text-xs text-slate-300 font-medium">Extracted Schema & Evidence Calibration</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-800/80 px-3 py-1 font-mono text-xs font-semibold text-slate-300 border border-slate-700/60">
          STRICT STRUCTURED OUTPUT
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Category">
          <span className="text-xl">{icon}</span>
          <span className="font-mono text-base font-bold text-white tracking-wide">{result.category}</span>
        </Field>

        <Field label="Priority">
          <PriorityBadge priority={result.priority} />
        </Field>

        <Field label="AI Confidence">
          <div className="w-full">
            <div className="flex items-center justify-between font-mono text-base font-bold text-white">
              <span>{confidencePct}%</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {confidencePct >= 70 ? "High Calibration" : "Calibrated Low"}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getConfidenceBarColor(confidencePct)}`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        </Field>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-indigo-950/30 p-5 shadow-lg">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-sky-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Issue Summary
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-200 font-medium">
          {result.issue_summary}
        </p>
        {result.affected_component && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-sky-500/20 pt-3 text-xs font-mono">
            <span className="text-slate-400 font-semibold">Affected Component:</span>
            <span className="rounded-lg bg-sky-500/10 px-2.5 py-1 border border-sky-500/30 text-sky-300 font-bold">
              {result.affected_component}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

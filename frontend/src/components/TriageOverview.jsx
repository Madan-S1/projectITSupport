import PriorityBadge from "./PriorityBadge.jsx";

const CATEGORY_ICONS = {
  Network: "🌐",
  Application: "💻",
  Account: "🔐",
  Device: "🖥️",
  Other: "⚙️",
};

function Field({ label, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">{children}</div>
    </div>
  );
}

export default function TriageOverview({ result }) {
  const confidencePct = Math.round(result.confidence * 100);
  const icon = CATEGORY_ICONS[result.category] || "📋";

  const getConfidenceBarColor = (pct) => {
    if (pct >= 70) return "bg-emerald-500";
    if (pct >= 40) return "bg-sky-500";
    return "bg-amber-500";
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100 font-bold text-xs">
            01
          </div>
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            Triage Overview
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-500">
          Structured Assessment
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Category">
          <span className="text-base">{icon}</span>
          <span className="font-mono text-sm font-bold text-slate-800">{result.category}</span>
        </Field>
        <Field label="Priority">
          <PriorityBadge priority={result.priority} />
        </Field>
        <Field label="AI confidence">
          <div className="w-full">
            <div className="flex items-center justify-between font-mono text-sm font-bold text-slate-800">
              <span>{confidencePct}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getConfidenceBarColor(confidencePct)}`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        </Field>
      </div>

      <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/40 p-4">
        <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-sky-800">
          Issue Summary
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-800 font-medium">
          {result.issue_summary}
        </p>
        {result.affected_component && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-sky-100/80 pt-2 text-xs font-mono text-slate-600">
            <span className="font-semibold text-slate-400">Affected Component:</span>
            <span className="rounded bg-white px-2 py-0.5 border border-sky-200 text-sky-900 font-bold">
              {result.affected_component}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

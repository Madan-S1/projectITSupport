import { useState } from "react";

function Block({ label, icon, children, accent = "sky" }) {
  const accentStyles = {
    sky: "border-slate-800 bg-slate-950/60 text-slate-200",
    emerald: "border-emerald-500/30 bg-emerald-950/20 text-emerald-200",
    amber: "border-amber-500/30 bg-amber-950/20 text-amber-200",
  };

  return (
    <div className={`rounded-2xl border p-5 ${accentStyles[accent] || accentStyles.sky}`}>
      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
        {icon && <span className="text-base">{icon}</span>}
        <span>{label}</span>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-slate-200 font-medium">{children}</p>
    </div>
  );
}

export default function RecommendationPanel({ result }) {
  const [copied, setCopied] = useState(false);

  const handleCopyAction = () => {
    if (result.recommended_action) {
      navigator.clipboard.writeText(result.recommended_action);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-300 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold">
            02
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              Troubleshooting Protocol
            </h2>
            <p className="text-xs text-slate-300 font-medium">Evidence-Grounded Next Steps & Rationale</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyAction}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs font-semibold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 active:scale-95 transition-all duration-150"
        >
          {copied ? (
            <>
              <span className="text-emerald-400">✓</span> Copied Action
            </>
          ) : (
            <>
              <span>📋</span> Copy Action
            </>
          )}
        </button>
      </div>

      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-950/80 to-teal-950/30 p-6 shadow-neonEmerald">
        <div className="flex items-center gap-2.5 font-mono text-xs font-extrabold uppercase tracking-wider text-emerald-400">
          <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recommended next step
        </div>
        <p className="mt-3 text-base font-bold leading-relaxed text-white">
          {result.recommended_action}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <Block label="Why this step?" icon="💡" accent="sky">
          {result.reason}
        </Block>

        <Block label="Expected result" icon="🎯" accent="emerald">
          {result.expected_observation}
        </Block>
      </div>

      {result.possible_next_direction && (
        <div className="pt-1">
          <Block label="If that doesn't resolve it" icon="🔄" accent="amber">
            {result.possible_next_direction}
          </Block>
        </div>
      )}
    </section>
  );
}

function Block({ label, icon, children, accent = "sky" }) {
  const accentStyles = {
    sky: "border-slate-100 bg-slate-50/70 text-slate-800",
    emerald: "border-emerald-100 bg-emerald-50/50 text-emerald-950",
    amber: "border-amber-100 bg-amber-50/40 text-amber-950",
  };

  return (
    <div className={`rounded-xl border p-4.5 ${accentStyles[accent] || accentStyles.sky}`}>
      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
        {icon && <span className="text-base">{icon}</span>}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-800 font-medium">{children}</p>
    </div>
  );
}

export default function RecommendationPanel({ result }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-200 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs">
            02
          </div>
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            Troubleshooting Plan
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
          Diagnostic Guidance
        </span>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-5 shadow-sm">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
          <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recommended next step
        </div>
        <p className="mt-2.5 text-base font-semibold leading-snug text-slate-900">
          {result.recommended_action}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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

const PRIORITY_CONFIG = {
  Low: {
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  Medium: {
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    dot: "bg-amber-500",
  },
  High: {
    badge: "bg-orange-500/10 text-orange-700 border-orange-500/30",
    dot: "bg-orange-500",
  },
  Critical: {
    badge: "bg-rose-500/10 text-rose-700 border-rose-500/30 animate-pulse",
    dot: "bg-rose-500",
  },
};

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || {
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono text-xs font-semibold ${config.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {priority}
    </span>
  );
}

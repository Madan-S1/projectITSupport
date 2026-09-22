const PRIORITY_CONFIG = {
  Low: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-neonEmerald",
    dot: "bg-emerald-400",
  },
  Medium: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-neonAmber",
    dot: "bg-amber-400",
  },
  High: {
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/40 shadow-neonAmber",
    dot: "bg-orange-400",
  },
  Critical: {
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-neonRose animate-pulse",
    dot: "bg-rose-500",
  },
};

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || {
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${config.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {priority}
    </span>
  );
}

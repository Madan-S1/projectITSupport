const SAMPLE_TICKETS = [
  {
    id: "01",
    icon: "📡",
    label: "Wi-Fi + Teams, client call soon",
    badge: "Urgent",
    message:
      "My laptop is connected to Wi-Fi but I can't access any websites. Teams isn't working either. I have a client call in 20 minutes.",
  },
  {
    id: "02",
    icon: "🔑",
    label: "Outlook password prompt",
    badge: "Auth",
    message:
      "I changed my password this morning. I can log into my laptop but Outlook keeps asking me for my password.",
  },
  {
    id: "03",
    icon: "⚡",
    label: "Laptop very slow",
    badge: "Device",
    message:
      "My laptop has become extremely slow since this morning. I only have Chrome, Outlook and Teams open.",
  },
  {
    id: "04",
    icon: "🌐",
    label: "Nothing connecting",
    badge: "Ambiguous",
    message: "Nothing is connecting since I changed my password.",
  },
  {
    id: "05",
    icon: "🚨",
    label: "Internet down",
    badge: "Ambiguous",
    message: "The internet is down.",
  },
];

export default function TicketInputPanel({
  message,
  onMessageChange,
  onAnalyze,
  isLoading,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) onAnalyze();
  };

  const nearLimit = message.length > 3500;

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-300"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400" />

      <div className="flex items-center justify-between">
        <label htmlFor="ticket-message" className="flex items-center gap-2.5 text-base font-bold text-white tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </span>
          Describe the employee's IT issue
        </label>
        <span className="rounded-full bg-slate-800/80 px-3 py-1 font-mono text-xs font-semibold text-sky-400 border border-slate-700/60">
          RAW TICKET INPUT
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400 font-medium">
        Include what's affected, when it started, and any business deadlines or impact scope.
      </p>

      <div className="relative mt-3.5">
        <textarea
          id="ticket-message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          disabled={isLoading}
          rows={5}
          maxLength={4000}
          placeholder="e.g. My laptop is connected to Wi-Fi but I can't access any websites…"
          className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-4 font-sans text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-400 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-sky-500/20 disabled:opacity-50 transition-all duration-200 resize-y shadow-inner"
        />
        <div
          className={`mt-1.5 text-right font-mono text-xs ${nearLimit ? "font-bold text-rose-400" : "text-slate-500"
            }`}
        >
          {message.length}/4000
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800/80 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Preset Test Tickets
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Select a sample to populate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-5">
          {SAMPLE_TICKETS.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.message}
              onClick={() => onMessageChange(t.message)}
              disabled={isLoading}
              className="glass-panel-hover flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-left disabled:opacity-50 group transition-all duration-200"
            >
              <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">{t.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors truncate">
                    {t.label}
                  </span>
                </div>
                <span className="mt-0.5 inline-block rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  {t.badge}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 p-[1px] shadow-neonSky disabled:opacity-40 active:scale-95 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2.5 rounded-[11px] bg-slate-950 px-7 py-3 text-sm font-bold text-white group-hover:bg-opacity-80 transition-colors">
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="font-mono tracking-wide">Analyzing…</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-sky-400 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="font-mono tracking-wide">Analyze ticket</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </form>
  );
}

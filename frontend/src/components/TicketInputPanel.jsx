const SAMPLE_TICKETS = [
  {
    id: "01",
    label: "Wi-Fi + Teams, client call soon",
    message:
      "My laptop is connected to Wi-Fi but I can't access any websites. Teams isn't working either. I have a client call in 20 minutes.",
  },
  {
    id: "02",
    label: "Outlook password prompt",
    message:
      "I changed my password this morning. I can log into my laptop but Outlook keeps asking me for my password.",
  },
  {
    id: "03",
    label: "Laptop very slow",
    message:
      "My laptop has become extremely slow since this morning. I only have Chrome, Outlook and Teams open.",
  },
  {
    id: "04",
    label: "Nothing connecting",
    message: "Nothing is connecting since I changed my password.",
  },
  {
    id: "05",
    label: "Internet down",
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
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-200 hover:shadow-lg"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />
      
      <div className="flex items-center justify-between">
        <label htmlFor="ticket-message" className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Describe the employee's IT issue
        </label>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-500">
          Input Panel
        </span>
      </div>

      <p className="mt-1.5 text-xs text-slate-500">
        Include what's affected, when it started, and any deadline if there is one.
      </p>

      <div className="relative mt-3">
        <textarea
          id="ticket-message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          disabled={isLoading}
          rows={5}
          maxLength={4000}
          placeholder="e.g. My laptop is connected to Wi-Fi but I can't access any websites…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60 transition-all duration-200 resize-y"
        />
        <div
          className={`mt-1.5 text-right font-mono text-xs ${
            nearLimit ? "font-semibold text-rose-500" : "text-slate-400"
          }`}
        >
          {message.length}/4000
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Preset Sample Tickets
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TICKETS.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.message}
                onClick={() => onMessageChange(t.message)}
                disabled={isLoading}
                className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-sky-400 hover:bg-sky-50/60 hover:text-sky-700 active:scale-95 disabled:opacity-50 transition-all duration-150"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-sky-500 transition-colors" />
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-900/10 hover:from-sky-600 hover:to-sky-700 active:scale-95 disabled:opacity-40 whitespace-nowrap transition-all duration-200"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Analyze ticket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

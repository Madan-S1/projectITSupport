export default function ErrorBanner({ message, onRetry, retryable = true }) {
  return (
    <div
      role="alert"
      className="glass-panel relative overflow-hidden rounded-3xl border-rose-500/40 bg-rose-950/30 p-6 shadow-2xl transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-lg shadow-neonRose">
          ⚠️
        </div>
        <div className="flex-1">
          <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-rose-400">
            Analysis unavailable
          </p>
          <p className="mt-1.5 text-sm text-slate-200 font-medium leading-relaxed">{message}</p>
          {retryable && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 font-mono text-xs font-bold text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all duration-150 shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

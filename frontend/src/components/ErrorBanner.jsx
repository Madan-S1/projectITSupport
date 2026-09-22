export default function ErrorBanner({ message, onRetry, retryable = true }) {
  return (
    <div
      role="alert"
      className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-card transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-rose-700">
            Analysis unavailable
          </p>
          <p className="mt-1 text-sm text-slate-800 font-medium leading-relaxed">{message}</p>
          {retryable && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-1.5 font-mono text-xs font-semibold text-rose-700 hover:bg-rose-100/60 active:scale-95 transition-all duration-150 shadow-sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

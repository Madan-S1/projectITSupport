export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md text-slate-100 shadow-lg">
      <div className="mx-auto max-w-4xl px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-lg font-bold tracking-tight text-white">
                  ITriage
                </h1>
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                  AI v2.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI-Powered IT Support Triage Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-xs text-slate-300">
              System Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

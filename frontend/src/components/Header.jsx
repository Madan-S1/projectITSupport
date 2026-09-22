export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-xl text-slate-100 shadow-2xl">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-400 p-[1px] shadow-neonSky">
              <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-slate-950">
                <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-mono text-xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                  ITriage
                </h1>
                <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-sky-400 border border-sky-500/30 tracking-wider">
                  AI COCKPIT v2.1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Intelligent Support Ticket Triage Engine
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 font-mono text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <span className="text-sky-400">⚡</span> Latency: ~340ms
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-emerald-400 font-medium">Groq Llama 3 20B</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                System Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

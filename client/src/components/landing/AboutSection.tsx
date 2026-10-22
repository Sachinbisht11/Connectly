export default function AboutSection() {
  return (
    <section id="about" className="py-20 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl mb-4">
            About Connectly
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Connectly is a real-time messaging platform built for teams and
            individuals who need instant conversations plus reliable scheduled
            message delivery — all in one workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                >
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Instant, always</h3>
                <p className="text-sm text-slate-400">
                  Messages are delivered the moment they are sent, powered by
                  WebSockets for real-time conversation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center text-cyan-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                >
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Scheduled delivery</h3>
                <p className="text-sm text-slate-400">
                  Write now and send later. Schedule messages across time zones
                  and track delivery status every step of the way.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Reliable by design</h3>
                <p className="text-sm text-slate-400">
                  Delivery status, retry logic, and scheduled-message tracking
                  so nothing gets lost or arrives too early.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-cyan-500/10 to-violet-500/30 rounded-3xl blur opacity-40 pointer-events-none" />
              <div className="relative z-10 w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Alex" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Alex Rivera</p>
                      <p className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">9:41 AM</span>
                </div>
                <div className="p-3 space-y-3 max-h-[200px] overflow-y-auto">
                  <div className="flex justify-start">
                    <div className="max-w-[70%] px-3 py-1.5 rounded-2xl bg-slate-200 text-slate-900 text-sm rounded-tl-none">
                      Hey! Are we still on for tomorrow?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[70%] px-3 py-1.5 rounded-2xl bg-blue-600 text-white text-sm rounded-tr-none">
                      Yes — I&apos;ll send the details once this call wraps up.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[70%] px-3 py-1.5 rounded-2xl bg-slate-200 text-slate-900 text-sm rounded-tl-none">
                      Sounds good, talk soon 👍
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

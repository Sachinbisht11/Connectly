/**
 * SignInBrandingPanel — left column of the split-screen sign-in page.
 * Compact Connectly branding with headline, short description, and feature highlights.
 */

interface FeatureHighlight {
  title: string;
  description: string;
}

const highlights: FeatureHighlight[] = [
  {
    title: "Instant conversations",
    description: "Real-time messaging powered by WebSockets.",
  },
  {
    title: "Scheduled delivery",
    description: "Write now, send later — across time zones.",
  },
  {
    title: "Organized communication",
    description: "Direct chats, groups, and scheduled-message tracking.",
  },
];

export default function SignInBrandingPanel() {
  return (
    <div className="relative w-full max-w-[400px] flex-1 bg-slate-950 overflow-hidden">
      <div className="relative z-10 flex flex-col h-full p-6 sm:p-8 lg:p-12 items-start justify-center">
        {/* Brand header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-lg shadow-blue-500/40 flex items-center justify-center">
            <span className="text-sm font-bold text-white tracking-tighter">
              C
            </span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Connectly
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Real-time messaging
          </span>
        </div>

        {/* Headline */}
        <h1 className="mt-5 text-xl font-bold text-white tracking-tight leading-tight sm:text-2xl">
          Stay connected. Right on time.
        </h1>

        <p className="mt-2.5 text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xs">
          Connectly combines instant messaging with reliable scheduled message
          delivery so your messages arrive exactly when you mean them to.
        </p>

        {/* Feature highlights */}
        <div className="mt-7 space-y-2.5">
          {highlights.map((h, i) => (
            <div key={h.title} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-900/30 flex items-center justify-center flex-shrink-0 border border-blue-500/20 shrink-0">
                <span className="text-[9px] font-bold text-blue-400">
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">{h.title}</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {h.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * MessagingPreview — an attractive, animated product preview shown on the
 * landing page hero. It renders a stylised conversation with message bubbles,
 * timestamps, online indicators, and a scheduled-message card.
 */

interface BubbleProps {
  mine: boolean;
  text: string;
  time: string;
  scheduled?: boolean;
}

function MessageBubble({ mine, text, time, scheduled }: BubbleProps) {
  return (
    <div
      className={`flex ${
        mine ? 'justify-end' : 'justify-start'
      } mb-4 message-bubble`}
    >
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          mine
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-slate-200 text-slate-900 rounded-tl-none'
        }`}
      >
        {text}
        <div className={`text-[10px] mt-1 opacity-60 ${
          mine ? 'text-right' : 'text-left'
        }`}>
          {time}{scheduled ? '  ·  scheduled' : ''}
        </div>
      </div>
    </div>
  );
}

function OnlineIndicator() {
  return (
    <div className="relative w-2 h-2">
      <span className="absolute inset-0 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
    </div>
  );
}

export default function MessagingPreview() {
  return (
    <div className="w-full max-w-md mx-auto mt-4 sm:mt-0 relative">
      {/* Decorative glow behind the preview panel */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-violet-500/20 rounded-3xl blur opacity-30 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
        {/* Conversation header */}
        <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                alt="Alex"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Alex Rivera</p>
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <OnlineIndicator /> Online
              </p>
            </div>
          </div>
          <div className="text-slate-500 text-xs">9:41 AM</div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[320px]">
          <MessageBubble mine={false} text="Hey! Are we still on for tomorrow?" time="9:30 AM" />
          <MessageBubble mine={true} text="Yes! I’ll send over the details once I finish this call." time="9:32 AM" />
          <MessageBubble mine={false} text="Sounds good, talk soon 👍" time="9:33 AM" />
          <MessageBubble mine={true} text="Don’t forget — the project proposal is due Friday at 2 PM." time="9:35 AM" scheduled />
        </div>

        {/* Scheduled message card */}
        <div className="px-4 pb-4">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mt-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <svg
                className="w-4 h-4"
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
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Scheduled message</p>
              <p className="text-xs text-slate-400">
                Delivers tomorrow at 2:00 PM · Can still be edited
              </p>
            </div>
            <button className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4">Edit</button>
          </div>
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 border-t border-white/10 bg-white/5">
          <div className="relative">
            <input
              type="text"
              placeholder="Message…"
              className="w-full pl-4 pr-10 py-2.5 text-sm text-white bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-slate-500"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              >
                <path d="M22 12.046A3.001 3.001 0 0017.954 15H17a1 1 0 01-1-1c0-4.278-2.807-7.764-6.5-8.295V1h5l2 2v7a1 1 0 01-1 1h-1l-2 2h1v7a1 1 0 01-1 1h-1l-2 2v7a1 1 0 01-1 1h-5c-3.024 0-5.478-2.478-5.977-5.467" />
                <path d="M22 12.046A3.001 3.001 0 0017.954 15H17a1 1 0 01-1-1c0-4.278-2.807-7.764-6.5-8.295V1h5l2 2v7a1 1 0 01-1 1h-1l-2 2h1v7a1 1 0 01-1 1h-1l-2 2v7a1 1 0 01-1 1h-5c-3.024 0-5.478-2.478-5.977-5.467" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import MessagingPreview from './MessagingPreview';
import { ArrowRightIcon } from '../ui/Icons';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Text content (left on desktop, full width on mobile) */}
          <div className="lg:pr-16 lg:max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-white/10 backdrop-blur-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Real-Time Messaging
              </span>
            </div>

            <h1 className="text-4xl font-bold text-white tracking-tight leading-tight sm:text-5xl lg:text-6xl mb-6">
              Conversations that connect.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400">
                Messages that arrive on time.
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg">
              Connectly combines instant messaging with reliable scheduled message
              delivery. Send messages now or schedule them for the perfect moment —
              across time zones, without the back-and-forth.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/sign-in"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-base font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Get Started <ArrowRightIcon />
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-transparent border border-white/20 text-white text-base font-semibold hover:bg-white/10 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Explore Features
              </button>
            </div>
          </div>

          {/* Messaging preview (right on desktop, beneath text on mobile) */}
          <div className="mt-10 sm:mt-0">
            <MessagingPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

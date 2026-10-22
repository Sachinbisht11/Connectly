import { ClockIcon, MessageIcon, ShieldCheckIcon, GlobeIcon } from '../ui/Icons';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  colorClass?: string;
}

const iconColors: Record<string, string> = {
  MessageIcon: 'text-blue-400',
  ClockIcon: 'text-cyan-400',
  ShieldCheckIcon: 'text-violet-400',
  GlobeIcon: 'text-blue-300',
};

export function FeatureCard({ icon: Icon, title, description, colorClass }: FeatureCardProps) {
  const resolvedColor = colorClass || iconColors[(Icon as React.ComponentType<any>).displayName || (Icon as React.ComponentType<any>).name] || 'text-blue-400';

  return (
    <div className="group p-6 rounded-2xl border border-slate-200/50 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-slate-900/20 hover:border-blue-500/30 hover:-translate-y-1.5 shadow-lg shadow-black/10">
      <div className="w-12 h-12 rounded-xl bg-blue-900/20 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300 border border-blue-500/20 group-hover:border-blue-500">
        <Icon className={`w-5 h-5 ${resolvedColor} group-hover:text-white transition-colors duration-300`} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

const features = [
  {
    icon: MessageIcon,
    title: 'Real-Time Messaging',
    description: 'Instant conversations powered by WebSockets, so your messages arrive the moment they are sent.',
  },
  {
    icon: ClockIcon,
    title: 'Scheduled Messages',
    description: 'Write a message now and have it delivered at exactly the right time, every time.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Reliable Delivery',
    description: 'Track scheduled-message status and get clear delivery feedback for every message.',
  },
  {
    icon: GlobeIcon,
    title: 'Timezone-Friendly Scheduling',
    description: 'Communicate across different time zones without the back-and-forth.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">
            Built for conversations that matter
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-lg">
            Connectly blends instant messaging with reliable scheduled delivery so nothing gets lost and nothing arrives too early.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

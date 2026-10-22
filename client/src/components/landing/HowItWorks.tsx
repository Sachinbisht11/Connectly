export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Sign in to your workspace',
      description:
        'Create your account or sign in to your existing Connectly workspace in seconds.',
    },
    {
      number: '02',
      title: 'Start a conversation or schedule a message',
      description:
        'Jump into an instant chat, or write a message now and set it to deliver later — perfect for any time zone.',
    },
    {
      number: '03',
      title: 'Connectly delivers at the right time',
      description:
        'Your messages arrive exactly when you want them, with delivery status and feedback every step of the way.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-900/30 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl mb-4">
            How it works
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            From sign-in to delivery, in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-600/20">
                <span className="text-sm font-bold text-white">{step.number}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

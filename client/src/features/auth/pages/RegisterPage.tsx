import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../AuthContext';
import { Button } from '../../../components/ui/Button';
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '../../../components/ui/Icons';

const schema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

const highlights = [
  {
    title: 'Instant conversations',
    description: 'Real-time messaging powered by WebSockets.',
  },
  {
    title: 'Scheduled delivery',
    description: 'Write now, send later across time zones.',
  },
  {
    title: 'Organized communication',
    description: 'Direct chats, groups, and scheduled-message tracking.',
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const onSubmit = (data: FormValues) => {
    setError('');
    setSubmitting(true);
    authRegister(data.displayName, data.email, data.password)
      .then(() => {
        navigate('/conversations');
      })
      .catch(() => {
        setError(
          'Unable to create account. This email may already be registered.'
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-200 selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <div className="min-h-[calc(100dvh-2rem)] flex flex-col lg:flex-row gap-6 lg:gap-0 items-start lg:items-center justify-center">
          {/* Left branding panel — mirrors SignInBrandingPanel styling */}
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
                Start connecting today.
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

          {/* Right registration panel — mirrors SignInForm styling */}
          <div className="flex-1 w-full max-w-[420px]">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-white/10 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">C</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Create your account
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Join Connectly and stay connected.
              </p>

              {error && (
                <div
                  role="alert"
                  className="w-full rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300 flex items-start gap-2 mt-4 text-left"
                >
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p>{error}</p>
                </div>
              )}

              <form
                onSubmit={(e) => void handleSubmit(onSubmit)(e)}
                className="w-full mt-6 bg-slate-900/60 rounded-xl border border-white/10 p-6 shadow-2xl shadow-black/30 space-y-4 backdrop-blur-sm text-left"
              >
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300" htmlFor="displayName">
                    Display name
                  </label>
                  <div className="relative">
                    <input
                      {...registerField('displayName')}
                      type="text"
                      id="displayName"
                      autoComplete="name"
                      placeholder="Alex Rivera"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-white placeholder-slate-500 ${
                        errors.displayName ? 'border-red-500' : 'border-white/10'
                      } bg-slate-950`}
                    />
                    {errors.displayName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500" />{' '}
                        {errors.displayName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-3 text-slate-500" />
                    <input
                      {...registerField('email')}
                      type="email"
                      id="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-white placeholder-slate-500 ${
                        errors.email ? 'border-red-500' : 'border-white/10'
                      } bg-slate-950`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500" />{' '}
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-300" htmlFor="password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-3 text-slate-500" />
                    <input
                      {...registerField('password')}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-white placeholder-slate-500 ${
                        errors.password ? 'border-red-500' : 'border-white/10'
                      } bg-slate-950`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500" />{' '}
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account <ArrowRightIcon className="ml-1" />
                    </>
                  )}
                </Button>

                <p className="mt-4 text-center text-sm text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/sign-in')}
                    className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
                  >
                    Sign in
                  </button>
                </p>

                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="mt-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeftIcon className="w-3 h-3 mr-1" /> Back to home
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

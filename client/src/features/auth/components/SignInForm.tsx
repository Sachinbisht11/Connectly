/**
 * SignInForm — the right side of the split-screen sign-in page.
 * Connects to the existing POST /api/auth/login endpoint and reuses the
 * application's AuthContext (login, sessionStorage token, redirect to /conversations).
 * No OAuth buttons are rendered because Google/GitHub providers are not configured.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../AuthContext';
import { Button } from '../../../components/ui/Button';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon, ArrowLeftIcon } from '../../../components/ui/Icons';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

interface SignInFormProps {
  onSignup?: () => void;
  onBackToHome?: () => void;
}

export default function SignInForm({ onSignup, onBackToHome }: SignInFormProps = {}) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: FormValues) => {
    setError(null);
    setSubmitting(true);
    login(data.email, data.password)
      .then(() => {
        navigate('/conversations');
      })
      .catch((err: unknown) => {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
            : null;
        setError(message || 'Invalid email or password. Please try again.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="flex-shrink-0 w-full max-w-[380px] bg-slate-950 relative overflow-hidden">
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[380px] space-y-6">
          {/* Header */}
          <div className="text-center mb-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-sm border border-white/10 mb-3">
              <span className="text-xl font-bold text-blue-600">C</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-400 mt-1">
              Sign in to continue to your Connectly workspace.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300 flex items-start gap-2"
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

          {/* Sign-in form */}
          <form
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            className="bg-slate-900/60 rounded-xl border border-white/10 p-6 shadow-2xl shadow-black/30 space-y-4 backdrop-blur-sm"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-3 text-slate-500" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-white placeholder-slate-500 ${
                    errors.email ? 'border-red-500' : 'border-white/10'
                  } bg-slate-950`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
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
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                id="remember"
                defaultChecked
                className="rounded border-slate-600 text-blue-600 focus:ring-blue-500 h-4 w-4 bg-slate-950"
              />
              <label className="cursor-pointer select-none" htmlFor="remember">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRightIcon className="ml-1" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-slate-950 px-2 text-slate-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social buttons — omitted intentionally: no OAuth providers configured */}
          </form>

          {/* Links */}
          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            {onSignup ? (
              <button
                type="button"
                onClick={onSignup}
                className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
              >
                Create an account
              </button>
            ) : (
              <span className="font-medium text-slate-300">registration not available</span>
            )}
          </p>

          {onBackToHome && (
            <p className="text-center text-sm text-slate-500">
              <button
                type="button"
                onClick={onBackToHome}
                className="flex items-center justify-center gap-1 font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
              >
                <ArrowLeftIcon className="w-3 h-3" /> Back to home
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

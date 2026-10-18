import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../AuthContext';

const schema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        navigate('/profile');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create an account
          </h1>
          <p className="text-gray-600">Join Connectly today</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Display name
            </label>
            <input
              {...registerField('displayName')}
              type="text"
              className={`mt-1 block w-full rounded-md border ${
                errors.displayName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Alex Rivera"
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...registerField('email')}
              type="email"
              className={`mt-1 block w-full rounded-md border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              {...registerField('password')}
              type="password"
              className={`mt-1 block w-full rounded-md border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create account
          </button>

          <p className="text-sm text-gray-600 text-center">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

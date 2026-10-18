import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../AuthContext';

const schema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  about: z.string().max(500, 'About must be at most 500 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      about: user?.about ?? undefined,
    },
  });

  const onSubmit = (data: FormValues) => {
    setMessage('');
    setSubmitting(true);
    updateProfile(data)
      .then(() => {
        reset(data);
        setMessage('Profile updated successfully.');
      })
      .catch(() => {
        setMessage('Failed to update profile. Please try again.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Email</p>
          <p className="text-gray-900">{user.email}</p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Display name
            </label>
            <input
              {...register('displayName')}
              type="text"
              className={`mt-1 block w-full rounded-md border ${
                errors.displayName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">About</label>
            <textarea
              {...register('about')}
              className={`mt-1 block w-full rounded-md border ${
                errors.about ? 'border-red-500' : 'border-gray-300'
              } h-24`}
              placeholder="Tell people about yourself..."
            />
            {errors.about && (
              <p className="mt-1 text-sm text-red-600">{errors.about.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            Save changes
          </button>
        </form>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.startsWith('Failed')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

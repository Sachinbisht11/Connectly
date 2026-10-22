import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../AuthContext';
import { api } from '../../../lib/api';

const schema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  about: z.string().max(500, 'About must be at most 500 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage('');
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post<{ user: { avatar: string | null } }>('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update the user in context with the new avatar
      updateProfile({ avatar: res.data.user.avatar });
      setMessage('Profile picture updated successfully.');
    } catch {
      setMessage('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const getAvatarUrl = (avatar?: string | null): string => {
    if (!avatar) return '';
    // If it's already a full URL or data URL, use as is
    if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;
    // Otherwise, it's a relative path from our backend
    return avatar;
  };

  if (!user) {
    return null;
  }

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <div className="flex-1 max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${user.displayName}'s avatar`}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <label
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
              htmlFor="avatar-upload"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => void onAvatarChange(e)}
                disabled={uploadingAvatar}
              />
            </label>
          </div>
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="text-slate-900 font-medium">{user.email}</p>
          </div>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Display name
            </label>
            <input
              {...register('displayName')}
              type="text"
              className={`w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                errors.displayName ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">About</label>
            <textarea
              {...register('about')}
              className={`w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-24 ${
                errors.about ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Tell people about yourself..."
            />
            {errors.about && (
              <p className="mt-1 text-sm text-red-600">{errors.about.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save changes
          </button>
        </form>

        {message && (
          <div
            className={`rounded-lg p-3 text-sm ${
              message.startsWith('Failed')
                ? 'bg-red-50 text-red-700 border border-red-100'
                : 'bg-green-50 text-green-700 border border-green-100'
            }`}
          >
            {message}
          </div>
        )}

        {uploadingAvatar && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Uploading profile picture...
          </div>
        )}
      </div>
    </div>
  );
}
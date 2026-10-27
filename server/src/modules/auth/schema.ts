import { z } from 'zod';

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .optional(),
  about: z.string().max(500, 'About must be at most 500 characters').optional(),
  
avatar: z
  .string()
  .refine(
    (value) =>
      value.startsWith('/api/users/avatars/') ||
      /^https?:\/\/.+/.test(value),
    'Invalid avatar URL'
  )
  .optional()
  .nullable(),

});

export const searchSchema = z.object({
  q: z.string().trim().min(1, 'Search query is required'),
  limit: z.coerce.number().min(1).max(50).default(10),
});

import { z } from 'zod';
import { ObjectId } from 'mongodb';

const objectIdSchema = z.custom<ObjectId>((val) => {
  if (val instanceof ObjectId) return true;
  return typeof val === 'string' && ObjectId.isValid(val);
}, 'Invalid ID');

// Max upload size: 10 MB.
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types for media attachments.
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
] as const;

// POST /api/conversations/:conversationId/media — validate conversation id from params.
export const uploadMediaParamsSchema = z.object({
  conversationId: objectIdSchema,
});

export type UploadMediaParams = z.infer<typeof uploadMediaParamsSchema>;

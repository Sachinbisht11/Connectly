import { z } from 'zod';
import { ObjectId } from 'mongodb';

const objectIdSchema = z.custom<ObjectId>((val) => {
  if (val instanceof ObjectId) return true;
  return typeof val === 'string' && ObjectId.isValid(val);
}, 'Invalid ID');

export const sendMessageSchema = z.object({
  textContent: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
});

export const messageQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  before: objectIdSchema.optional(), // message id to paginate before
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;

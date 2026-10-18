import { z } from 'zod';
import { ObjectId } from 'mongodb';

const objectIdSchema = z.custom<ObjectId>((val) => {
  if (val instanceof ObjectId) return true;
  return typeof val === 'string' && ObjectId.isValid(val);
}, 'Invalid ID');

export const createConversationSchema = z.object({
  participantId: objectIdSchema,
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

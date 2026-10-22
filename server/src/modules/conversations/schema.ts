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

// POST /api/conversations/group — create a new group conversation.
export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100, 'Group name too long'),
  description: z.string().trim().max(500, 'Description too long').optional(),
  participantIds: z.array(objectIdSchema).min(2, 'A group needs at least 2 participants').max(100),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

// PATCH /api/conversations/:conversationId/group — update group metadata.
export const updateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100, 'Group name too long').optional(),
  description: z.string().trim().max(500, 'Description too long').optional(),
  avatar: z.string().trim().max(500, 'Avatar URL too long').optional().nullable(),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

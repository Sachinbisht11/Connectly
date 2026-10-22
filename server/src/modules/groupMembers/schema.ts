import { z } from 'zod';
import { ObjectId } from 'mongodb';

const objectIdSchema = z.custom<ObjectId>((val) => {
  if (val instanceof ObjectId) return true;
  return typeof val === 'string' && ObjectId.isValid(val);
}, 'Invalid ID');

// POST /api/conversations/:conversationId/members — add a member (admin only)
export const addMemberSchema = z.object({
  userId: objectIdSchema,
});

// PATCH /api/conversations/:conversationId/members/:userId/role — change role (admin only)
export const changeRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

import { z } from 'zod';

export const createScheduledMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content is required').max(4000, 'Message too long'),
  scheduledAt: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'scheduledAt must be a valid ISO 8601 datetime'
  }),
});

export const updateScheduledMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(4000, 'Message too long').optional(),
  scheduledAt: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'scheduledAt must be a valid ISO 8601 datetime'
  }).optional(),
});

export const scheduledMessageParamsSchema = z.object({
  scheduledMessageId: z.string().min(1, 'Scheduled message ID is required'),
});



export const listScheduledMessagesQuerySchema = z.object({
  status: z.enum([
    'scheduled',
    'processing',
    'sent',
    'failed',
    'cancelled',
  ]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type ScheduledMessageStatus = z.infer<
  typeof listScheduledMessagesQuerySchema
>['status'];

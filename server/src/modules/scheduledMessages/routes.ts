import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth';
import type { ScheduledMessageStatus } from './schema';
import {
  createScheduledMessage,
  listScheduledMessages,
  getScheduledMessage,
  updateScheduledMessage,
  cancelScheduledMessage,
  getScheduledMessageCounts,
} from './service';
import {
  createScheduledMessageSchema,
  updateScheduledMessageSchema,
  scheduledMessageParamsSchema,
  listScheduledMessagesQuerySchema,
} from './schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/scheduled-messages — list user's scheduled messages


router.get(
  '/',
  validate(listScheduledMessagesQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, limit, cursor } = req.query as {
      status?: ScheduledMessageStatus;
      limit?: string;
      cursor?: string;
    };

    const { messages, hasMore, nextCursor } =
      await listScheduledMessages(
        (req as AuthenticatedRequest).user!.userId,
        {
          status,
          limit: limit ? parseInt(limit, 10) : 50,
          cursor,
        }
      );

    res.json({ messages, hasMore, nextCursor });
  })
);



// GET /api/scheduled-messages/counts — get counts by status
router.get(
  '/counts',
  asyncHandler(async (req: Request, res: Response) => {
    const counts = await getScheduledMessageCounts(
      (req as AuthenticatedRequest).user!.userId
    );
    res.json({ counts });
  })
);

// POST /api/scheduled-messages — create a new scheduled message
router.post(
  '/',
  validate(createScheduledMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { conversationId, content, scheduledAt } = req.body as {
      conversationId: string;
      content: string;
      scheduledAt: string;
    };
    console.log('[ScheduledMessage] POST /api/scheduled-messages:', { conversationId, content, scheduledAt });
    const scheduledMessage = await createScheduledMessage({
      senderId: (req as AuthenticatedRequest).user!.userId,
      conversationId,
      content,
      scheduledAt: new Date(scheduledAt),
    });
    res.status(201).json({ scheduledMessage });
  })
);

// GET /api/scheduled-messages/:scheduledMessageId — get a single scheduled message
router.get(
  '/:scheduledMessageId',
  validate(scheduledMessageParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const scheduledMessage = await getScheduledMessage(
      req.params['scheduledMessageId'],
      (req as AuthenticatedRequest).user!.userId
    );
    res.json({ scheduledMessage });
  })
);

// PATCH /api/scheduled-messages/:scheduledMessageId — update a scheduled message
router.patch(
  '/:scheduledMessageId',
  validate(scheduledMessageParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Validate body separately
    const bodyResult = updateScheduledMessageSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw bodyResult.error;
    }
    const { content, scheduledAt } = bodyResult.data;
    const scheduledMessage = await updateScheduledMessage(
      req.params['scheduledMessageId'],
      (req as AuthenticatedRequest).user!.userId,
      { content, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined }
    );
    res.json({ scheduledMessage });
  })
);

// DELETE /api/scheduled-messages/:scheduledMessageId — cancel a scheduled message
router.delete(
  '/:scheduledMessageId',
  validate(scheduledMessageParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const scheduledMessage = await cancelScheduledMessage(
      req.params['scheduledMessageId'],
      (req as AuthenticatedRequest).user!.userId
    );
    res.json({ scheduledMessage });
  })
);

export default router;
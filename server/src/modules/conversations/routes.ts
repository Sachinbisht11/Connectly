import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth';
import {
  createOrFindDirectConversation,
  createGroupConversation,
  listConversations,
  getConversationAndVerifyMembership,
  updateGroupMetadata,
} from './service';
import {
  createConversationSchema,
  createGroupSchema,
  updateGroupSchema,
} from './schema';
import { sendMessage, listMessages } from '../messages/service';
import { sendMessageSchema, messageQuerySchema } from '../messages/schema';

const router = Router();

// POST /api/conversations — create or find a direct conversation with another user
router.post(
  '/',
  authenticate,
  validate(createConversationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { participantId } = req.body as { participantId: string };
    const { conversation, created } = await createOrFindDirectConversation(
      (req as AuthenticatedRequest).user!.userId,
      participantId
    );
    res.status(created ? 201 : 200).json({ conversation, created });
  })
);

// POST /api/conversations/group — create a new group conversation
router.post(
  '/group',
  authenticate,
  validate(createGroupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { conversation } = await createGroupConversation(
      (req as AuthenticatedRequest).user!.userId,
      req.body as { name: string; description?: string; participantIds: string[] }
    );
    res.status(201).json({ conversation });
  })
);

// PATCH /api/conversations/:conversationId/group — update group metadata (admin only)
router.patch(
  '/:conversationId/group',
  authenticate,
  validate(updateGroupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { conversation } = await updateGroupMetadata(
      req.params['conversationId'],
      (req as AuthenticatedRequest).user!.userId,
      req.body as { name?: string; description?: string; avatar?: string | null }
    );
    res.json({ conversation });
  })
);

// GET /api/conversations — list conversations the current user participates in
router.get(
  '/',
  authenticate,
  asyncHandler(async (_req: Request, res: Response) => {
    const userId = (_req as AuthenticatedRequest).user!.userId;
    const conversations = await listConversations(userId);
    res.json({ conversations });
  })
);

// POST /api/conversations/:conversationId/messages — send a text message
router.post(
  '/:conversationId/messages',
  authenticate,
  validate(sendMessageSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const conversation = await getConversationAndVerifyMembership(
      req.params['conversationId'],
      (req as AuthenticatedRequest).user!.userId
    );
    const { message } = await sendMessage(
      conversation._id.toString(),
      (req as AuthenticatedRequest).user!.userId,
      req.body as { textContent: string }
    );
    res.status(201).json({ message });
  })
);

// GET /api/conversations/:conversationId/messages — paginated message history
router.get(
  '/:conversationId/messages',
  authenticate,
  validate(messageQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const conversation = await getConversationAndVerifyMembership(
      req.params['conversationId'],
      (req as AuthenticatedRequest).user!.userId
    );
    const { messages, hasMore } = await listMessages(
      conversation._id.toString(),
      (req as AuthenticatedRequest).user!.userId,
      req.query as { limit?: number; before?: string }
    );
    res.json({ messages, hasMore });
  })
);

export default router;

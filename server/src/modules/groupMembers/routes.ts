import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  addMember,
  removeMember,
  leaveGroup,
  changeMemberRole,
  listMembers,
} from './service.js';
import { addMemberSchema, changeRoleSchema } from './schema.js';

const router = Router();

// POST /api/conversations/:conversationId/members — add a member (admin only)
router.post(
  '/:conversationId/members',
  authenticate,
  validate(addMemberSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { member } = await addMember(
      req.params['conversationId'],
      (req as AuthenticatedRequest).user!.userId,
      (req.body as { userId: string }).userId
    );
    res.status(201).json({ member });
  })
);

// DELETE /api/conversations/:conversationId/members/:userId — remove a member (admin only)
router.delete(
  '/:conversationId/members/:userId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await removeMember(
      req.params['conversationId'],
      (req as AuthenticatedRequest).user!.userId,
      req.params['userId']
    );
    res.json({ removed: true });
  })
);

// POST /api/conversations/:conversationId/members/leave — leave a group
router.post(
  '/:conversationId/members/leave',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await leaveGroup(
      req.params['conversationId'],
      (req as AuthenticatedRequest).user!.userId
    );
    res.json({ left: true });
  })
);

// PATCH /api/conversations/:conversationId/members/:userId/role — change member role (admin only)
router.patch(
  '/:conversationId/members/:userId/role',
  authenticate,
  validate(changeRoleSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { member } = await changeMemberRole(
      req.params['conversationId'],
      (req as AuthenticatedRequest).user!.userId,
      req.params['userId'],
      (req.body as { role: 'admin' | 'member' }).role
    );
    res.json({ member });
  })
);

// GET /api/conversations/:conversationId/members — list group members
router.get(
  '/:conversationId/members',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { members } = await listMembers(
      req.params['conversationId'],
      (req as AuthenticatedRequest).user!.userId
    );
    res.json({ members });
  })
);

export default router;

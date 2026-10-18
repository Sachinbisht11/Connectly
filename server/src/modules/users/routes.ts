import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { updateProfile, searchUsers } from '../auth/service';
import { validate } from '../../middleware/validate';
import { updateProfileSchema, searchSchema } from '../auth/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

// PATCH /api/users/me
router.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { user } = await updateProfile(
      (req as AuthenticatedRequest).user!.userId,
      req.body as {
        displayName?: string;
        about?: string;
        avatar?: string | null;
      }
    );
    res.json({ user });
  })
);

// GET /api/users/search
router.get(
  '/search',
  authenticate,
  validate(searchSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const parsedQuery = req.query as unknown as { q: string; limit?: number };
    const users = await searchUsers(parsedQuery.q, Number(parsedQuery.limit ?? 10));
    res.json({ users });
  })
);

export default router;

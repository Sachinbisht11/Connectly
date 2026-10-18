import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../middleware/auth';
import { register, login, getMe } from './service';
import { asyncHandler } from '../../middleware/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/auth/register
router.post(
  '/register',
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await register(req.body as {
      displayName: string;
      email: string;
      password: string;
    });
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ user });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await login(req.body as { email: string; password: string });
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ user });
  })
);

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { user } = await getMe((req as AuthenticatedRequest).user!.userId);
  res.json({ user });
}));

export default router;

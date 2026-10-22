import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { updateProfile, searchUsers } from '../auth/service';
import { validate } from '../../middleware/validate';
import { updateProfileSchema, searchSchema } from '../auth/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream, mkdirSync } from 'fs';
import { config } from '../../config';
import { AppError } from '../../middleware/error';

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

// POST /api/users/me/avatar — upload profile avatar
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const avatarDir = path.resolve(config.uploadDir || './uploads', 'avatars');
    mkdirSync(avatarDir, { recursive: true });
    cb(null, avatarDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post(
  '/me/avatar',
  authenticate,
  avatarUpload.single('avatar'),
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    const userId = (req as AuthenticatedRequest).user!.userId;
    const avatarUrl = `/api/users/avatars/${path.basename(file.path)}`;

    const { user } = await updateProfile(userId, { avatar: avatarUrl });
    res.json({ user });
  })
);

// GET /api/users/avatars/:filename — serve profile avatar
router.get(
  '/avatars/:filename',
  asyncHandler(async (req: Request, res: Response) => {
    const filename = req.params['filename'];
    const avatarDir = path.resolve(config.uploadDir || './uploads', 'avatars');
    const filePath = path.join(avatarDir, filename);

    try {
      await fs.access(filePath);
    } catch {
      throw new AppError('Avatar not found', 404, 'AVATAR_NOT_FOUND');
    }

    // Determine content type from extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    void createReadStream(filePath).pipe(res);
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

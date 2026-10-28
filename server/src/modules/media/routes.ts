import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream, mkdirSync } from 'fs';
import {
  saveMedia,
  getMediaWithAccess,
  UPLOAD_DIR,
} from './service.js';
import { uploadMediaParamsSchema } from './schema.js';
import { sendMessage } from '../messages/service.js';

const router = Router();

// Configure multer to store uploads in server/uploads with unique filenames.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// POST /api/conversations/:conversationId/media — upload a media attachment.
router.post(
  '/:conversationId/media',
  authenticate,
  validate(uploadMediaParamsSchema, 'params'),
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    const conversationId = req.params['conversationId'];
    const senderId = (req as AuthenticatedRequest).user!.userId;

    const media = await saveMedia(conversationId, senderId, file);

    // Create a linked Message so the attachment appears in the conversation.
    const { message } = await sendMessage(conversationId, senderId, {
      textContent: '',
      media: {
        mediaId: media._id.toString(),
        type: media.mimeType.startsWith('video/')
          ? 'video'
          : media.mimeType.startsWith('image/')
            ? 'image'
            : 'file',
        url: media.url,
        filename: media.filename,
        originalName: media.originalName,
        mimeType: media.mimeType,
        size: media.size,
      },
    });

    res.status(201).json({ message });
  })
);

// GET /api/media/:mediaId — serve an uploaded file (member access only).
router.get(
  '/media/:mediaId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { media, filePath } = await getMediaWithAccess(
      req.params['mediaId'],
      (req as AuthenticatedRequest).user!.userId
    );

    try {
      await fs.access(filePath);
    } catch {
      throw new AppError('Media file not found on disk', 404, 'MEDIA_FILE_NOT_FOUND');
    }

    res.setHeader('Content-Disposition', `inline; filename="${media.originalName}"`);
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Content-Length', String(media.size));
    void createReadStream(filePath).pipe(res);
  })
);

export default router;

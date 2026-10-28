import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'node:url';

import { config } from './config/index.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import conversationRoutes from './modules/conversations/routes.js';
import groupMemberRoutes from './modules/groupMembers/routes.js';
import mediaRoutes from './modules/media/routes.js';
import scheduledMessageRoutes from './modules/scheduledMessages/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Serve uploaded media files (member access enforced in routes).
  app.use('/api/uploads', express.static(path.resolve(__dirname, '../uploads')));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'connectly-api',
      env: config.nodeEnv,
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/conversations', groupMemberRoutes);
  app.use('/api/conversations', mediaRoutes);
  app.use('/api/scheduled-messages', scheduledMessageRoutes);

  // 404 for undefined routes
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use(errorHandler);

  return app;
}

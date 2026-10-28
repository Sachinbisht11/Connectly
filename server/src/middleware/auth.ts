import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Prefer the httpOnly cookie (set on login); fall back to a Bearer token
  // from the Authorization header for clients that cannot read cookies.
  let token: string | undefined;
  const cookies = req.cookies as Record<string, string> | undefined;
  token = cookies?.['token'];
  if (!token) {
    const auth = req.headers['authorization'];
    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
      token = auth.slice(7);
    }
  }
  if (!token) {
    res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
    });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as unknown as TokenPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' },
    });
  }
};

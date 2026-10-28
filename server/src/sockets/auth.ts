import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Data attached to an authenticated Socket.IO socket.
 */
export interface AuthenticatedSocketData {
  userId: string;
}

/**
 * Socket.IO authorization middleware.
 *
 * Authenticates the connection using a JWT passed through the client's
 * `auth` option (`{ auth: { token } }`). On success the user id is attached
 * to `socket.userId` so handlers can authorize room membership.
 *
 * Notes:
 * - The REST API authenticates via an httpOnly cookie. Socket.IO cannot rely on
 *   that cookie being sent over the WebSocket upgrade in all transports, so the
 *   client sends the JWT through the `auth` handshake option instead. The token
 *   is held in memory (and sessionStorage across reloads) by the client; this is
 *   documented in the client socket module. The httpOnly cookie remains the
 *   source of truth for REST endpoints.
 */
export function authenticateSocket(
  socket: Socket & { userId?: string },
  next: (err?: Error) => void
): void {
  const token = (socket.handshake.auth as { token?: string })?.token;
  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      userId: string;
    };
    socket.userId = payload.userId;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}

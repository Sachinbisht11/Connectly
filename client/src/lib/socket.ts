import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

let socket: Socket | null = null;

/**
 * Get (or create) the authenticated Socket.IO connection.
 *
 * The JWT token (returned by login/register and kept in sessionStorage) is
 * passed through Socket.IO's `auth` handshake option so the server can
 * authenticate the WebSocket connection. The httpOnly cookie remains the
 * source of truth for REST API calls made via `api` (axios sends cookies
 * automatically with `withCredentials: true`).
 *
 * Security notes (see AI_RULES_AND_MILESTONES.md):
 * - Storing the JWT in sessionStorage exposes it to XSS. This is a deliberate
 *   trade-off required for Socket.IO authentication; the token is short-lived
 *   (7 days) and cleared on logout.
 * - Never log the token or send it to third parties.
 */
export function getSocket(token: string | null): Socket | null {
  if (socket) return socket;

  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect_error', (err) => {
    // Surface auth failures but keep the app usable; REST still works via cookies.
    console.warn('Socket.IO connect error:', err.message);
  });

  return socket;
}

/**
 * Close the Socket.IO connection (e.g. on logout).
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { type Socket };

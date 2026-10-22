import { Server, Socket } from 'socket.io';
import { sendMessage } from '../modules/messages/service';

/**
 * Event payloads for Socket.IO messaging events.
 */
interface MessageSendPayload {
  conversationId: string;
  textContent?: string;
  media?: {
    type?: string;
    url?: string;
    filename?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
  };
}

interface MessageNewPayload {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: {
    id: string;
    displayName: string;
    avatar?: string | null;
  };
  type: string;
  textContent: string;
  media?: {
    id: string;
    url: string | undefined;
    filename?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
  };
  createdAt: string;
}

interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

/**
 * Room membership check reuses the REST service so socket and REST enforce
 * equivalent permissions (see AI_RULES_AND_MILESTONES.md security rules).
 */
async function assertConversationMember(
  socket: Socket & { userId?: string },
  conversationId: string
): Promise<void> {
  const { getConversationAndVerifyMembership } =
    await import('../modules/conversations/service');
  await getConversationAndVerifyMembership(
    conversationId,
    socket.userId!
  );
}

/**
 * Register messaging socket handlers on the Socket.IO server instance.
 *
 * - Authenticated clients join their user's conversation rooms when entering a
 *   conversation page (`message:join` / `message:leave`).
 * - `message:send` reuses the same `sendMessage` service as the REST endpoint
 *   so both paths enforce identical validation and authorization. The newly
 *   created message is then broadcast to the conversation room as `message:new`.
 * - `message:typing` broadcasts typing state to the conversation room.
 */
export function registerMessageHandlers(io: Server): void {
  io.on('connection', (socket: Socket & { userId?: string }) => {
    const userId = socket.userId;

    socket.on(
      'message:join',
      async ({ conversationId }: { conversationId: string }) => {
        if (!userId) return;
        try {
          await assertConversationMember(socket, conversationId);
          void socket.join(conversationId);
        } catch {
          // Membership check failure: do not join the room.
        }
      }
    );

    socket.on(
      'message:leave',
      ({ conversationId }: { conversationId: string }) => {
        if (!userId) return;
        void socket.leave(conversationId);
      }
    );

    socket.on(
      'message:send',
      async (
        payload: MessageSendPayload,
        callback?: (ack: { ok: boolean; error?: string }) => void
      ) => {
        if (!userId) {
          void callback?.({ ok: false, error: 'Authentication required' });
          return;
        }

        try {
          await assertConversationMember(socket, payload.conversationId);
          const { message } = await sendMessage(
            payload.conversationId,
            userId,
            { textContent: payload.textContent ?? '' }
          );

          // The message object from sendMessage already includes sender info
          const broadcast: MessageNewPayload = {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            sender: message.sender,
            type: message.type,
            textContent: message.textContent ?? '',
            media: message.media,
            createdAt: message.createdAt.toISOString(),
          };

          io.to(payload.conversationId).emit('message:new', broadcast);
          void callback?.({ ok: true });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Failed to send message';
          void callback?.({ ok: false, error: message });
        }
      }
    );

    socket.on(
      'message:typing',
      (payload: TypingPayload) => {
        if (!userId || payload.userId !== userId) return;
        socket
          .to(payload.conversationId)
          .emit('message:typing', {
            ...payload,
            userId,
          });
      }
    );

    socket.on('disconnect', () => {
      // Rooms are cleared automatically on disconnect.
    });
  });
}

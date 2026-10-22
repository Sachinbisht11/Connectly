import { Message, type IMessage, MessageType } from './model';
import { Conversation } from '../conversations/model';
import { User } from '../auth/model';
import { AppError } from '../../middleware/error';
import { sendMessageSchema, messageQuerySchema } from './schema';
import { Types } from 'mongoose';

export function messageDTO(msg: IMessage, sender?: { id: string; displayName: string; avatar?: string | null }) {
  return {
    id: msg._id.toString(),
    conversationId: msg.conversationId.toString(),
    senderId: msg.senderId.toString(),
    sender: sender
      ? {
          id: sender.id,
          displayName: sender.displayName,
          avatar: sender.avatar ?? undefined,
        }
      : undefined,
    type: msg.type,
    textContent: msg.textContent,
    media: msg.mediaId
      ? {
          id: msg.mediaId.toString(),
          url: msg.mediaUrl ?? undefined,
          filename: msg.mediaFilename ?? undefined,
          originalName: msg.mediaOriginalName ?? undefined,
          mimeType: msg.mediaMimeType ?? undefined,
          size: msg.mediaSize ?? undefined,
        }
      : undefined,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  };
}

/**
 * Send a text message in a conversation the user participates in.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  data: {
    textContent: string;
    media?: {
      mediaId?: string;
      type?: string;
      url?: string;
      filename?: string;
      originalName?: string;
      mimeType?: string;
      size?: number;
    };
  }
) {
  const parsed = sendMessageSchema.safeParse(data);
  if (!parsed.success) {
    throw parsed.error;
  }

  let conversation;
  try {
    conversation = await Conversation.findById(conversationId);
  } catch {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }
  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  const isParticipant = conversation.participantIds.some(
    (id) => id.toString() === senderId
  );
  if (!isParticipant) {
    throw new AppError('Not a participant of this conversation', 403, 'FORBIDDEN');
  }

  const message = await Message.create({
    conversationId,
    senderId,
    type: parsed.data.media ? (parsed.data.media.type as MessageType) : 'text',
    textContent: parsed.data.textContent,
    mediaId: parsed.data.media?.mediaId,
    mediaUrl: parsed.data.media?.url,
    mediaFilename: parsed.data.media?.filename,
    mediaOriginalName: parsed.data.media?.originalName,
    mediaMimeType: parsed.data.media?.mimeType,
    mediaSize: parsed.data.media?.size,
  });

  // Update the conversation's lastMessageId and touch updatedAt.
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageId: message._id,
  });

  // Fetch sender info
  const sender = await User.findById(senderId).select('displayName avatar').lean();
  return { message: messageDTO(message, sender ? { id: sender._id.toString(), displayName: sender.displayName, avatar: sender.avatar } : undefined) };
}

/**
 * List messages for a conversation with cursor-based pagination.
 * `before` is a message id; results return messages older than that id.
 */
export async function listMessages(
  conversationId: string,
  userId: string,
  data: { limit?: number; before?: string }
) {
  const parsed = messageQuerySchema.safeParse(data);
  if (!parsed.success) {
    throw parsed.error;
  }

  let conversation;
  try {
    conversation = await Conversation.findById(conversationId);
  } catch {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }
  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  const isParticipant = conversation.participantIds.some(
    (id) => id.toString() === userId
  );
  if (!isParticipant) {
    throw new AppError('Not a participant of this conversation', 403, 'FORBIDDEN');
  }

  const filter: Record<string, unknown> = { conversationId };
  if (parsed.data.before) {
    // Paginate by _id (monotonically increasing in MongoDB) so messages
    // created within the same millisecond are still ordered correctly.
    filter['_id'] = { $lt: new Types.ObjectId(parsed.data.before) };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(parsed.data.limit);

  // Fetch sender info for all messages
  const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))];
  const senders = await User.find({ _id: { $in: senderIds } }).select('displayName avatar').lean();
  const senderMap = new Map(senders.map((s) => [s._id.toString(), { id: s._id.toString(), displayName: s.displayName, avatar: s.avatar }]));

  return {
    messages: messages.map((m) => messageDTO(m, senderMap.get(m.senderId.toString()))).reverse(), // oldest first
    hasMore: messages.length === parsed.data.limit,
  };
}

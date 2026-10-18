import { Message, type IMessage } from './model';
import { Conversation } from '../conversations/model';
import { AppError } from '../../middleware/error';
import { sendMessageSchema, messageQuerySchema } from './schema';
import { Types } from 'mongoose';

export function messageDTO(msg: IMessage) {
  return {
    id: msg._id.toString(),
    conversationId: msg.conversationId.toString(),
    senderId: msg.senderId.toString(),
    type: msg.type,
    textContent: msg.textContent,
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
  data: { textContent: string }
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
    type: 'text',
    textContent: parsed.data.textContent,
  });

  // Update the conversation's lastMessageId and touch updatedAt.
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageId: message._id,
  });

  return { message: messageDTO(message) };
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

  return {
    messages: messages.map((m) => messageDTO(m)).reverse(), // oldest first
    hasMore: messages.length === parsed.data.limit,
  };
}

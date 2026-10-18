import { Conversation, type IConversation } from './model';
import { User } from '../auth/model';
import { AppError } from '../../middleware/error';
import { createConversationSchema } from './schema';

export function conversationDTO(conv: IConversation) {
  return {
    id: conv._id.toString(),
    type: conv.type,
    participantIds: conv.participantIds.map((id) => id.toString()),
    lastMessageId: conv.lastMessageId?.toString() ?? undefined,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  };
}

/**
 * Create or find an existing direct conversation between the current user
 * and the given participant. Direct conversations are unique per pair so we
 * never create duplicates for the same two users.
 */
export async function createOrFindDirectConversation(
  currentUserId: string,
  participantId: string
) {
  const parsed = createConversationSchema.safeParse({ participantId });
  if (!parsed.success) {
    throw parsed.error;
  }

  if (participantId === currentUserId) {
    throw new AppError('Cannot start a conversation with yourself', 400, 'SELF_CONVERSATION');
  }

  const participant = await User.findById(participantId);
  if (!participant) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Find an existing direct conversation with exactly these two participants.
  const existing = await Conversation.findOne({
    type: 'direct',
    participantIds: { $all: [currentUserId, participantId], $size: 2 },
  });

  if (existing) {
    return { conversation: conversationDTO(existing), created: false };
  }

  const conversation = await Conversation.create({
    type: 'direct',
    participantIds: [currentUserId, participantId],
  });

  return { conversation: conversationDTO(conversation), created: true };
}

/**
 * List conversations the current user participates in, most recently updated first.
 */
export async function listConversations(userId: string) {
  const conversations = await Conversation.find({
    participantIds: userId,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return conversations.map((c) => ({
    id: c._id.toString(),
    type: c.type,
    participantIds: c.participantIds.map((id) => id.toString()),
    lastMessageId: c.lastMessageId?.toString() ?? undefined,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

/**
 * Verify the current user is a participant of the conversation.
 * Returns the conversation document or throws.
 */
export async function getConversationAndVerifyMembership(
  conversationId: string,
  userId: string
) {
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

  return conversation;
}

import { Conversation, type IConversation } from './model';
import { GroupMember } from '../groupMembers/model';
import { User } from '../auth/model';
import { AppError } from '../../middleware/error';
import { createConversationSchema, createGroupSchema, updateGroupSchema } from './schema';

export function conversationDTO(conv: IConversation) {
  return {
    id: conv._id.toString(),
    type: conv.type,
    groupName: conv.groupName ?? undefined,
    groupDescription: conv.groupDescription ?? undefined,
    groupAvatar: conv.groupAvatar ?? undefined,
    creatorId: conv.creatorId ? conv.creatorId.toString() : undefined,
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

/**
 * Check whether a user is an admin of a group conversation.
 */
export async function verifyGroupAdmin(
  conversationId: string,
  userId: string
): Promise<IConversation> {
  const conversation = await getConversationAndVerifyMembership(
    conversationId,
    userId
  );

  if (conversation.type !== 'group') {
    throw new AppError('Not a group conversation', 400, 'NOT_A_GROUP');
  }
  if (!conversation.creatorId || conversation.creatorId.toString() !== userId) {
    throw new AppError('Only the group admin can perform this action', 403, 'FORBIDDEN');
  }

  return conversation;
}

/**
 * Create a new group conversation with the creator as an admin participant.
 */
export async function createGroupConversation(
  creatorId: string,
  data: { name: string; description?: string; participantIds: string[] }
) {
  const parsed = createGroupSchema.safeParse(data);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { name, description, participantIds } = parsed.data;

  if (!participantIds.some((id) => id.toString() === creatorId)) {
    throw new AppError('The creator must be a participant', 400, 'CREATOR_MUST_BE_PARTICIPANT');
  }

  // Validate all participants exist.
  const participants = await User.find({ _id: { $in: participantIds } });
  if (participants.length !== participantIds.length) {
    throw new AppError('One or more participants not found', 404, 'USER_NOT_FOUND');
  }

  const conversation = await Conversation.create({
    type: 'group',
    groupName: name,
    groupDescription: description ?? null,
    creatorId: creatorId,
    participantIds,
  });

  // Create membership records for all participants. The creator is an admin;
  // everyone else is a regular member.
  await GroupMember.insertMany(
    participantIds.map((id) => ({
      conversationId: conversation._id,
      userId: id,
      role: id.toString() === creatorId ? 'admin' : 'member',
    }))
  );

  return { conversation: conversationDTO(conversation) };
}

/**
 * Update group metadata. Only the group admin may do this.
 */
export async function updateGroupMetadata(
  conversationId: string,
  userId: string,
  data: { name?: string; description?: string; avatar?: string | null }
) {
  const parsed = updateGroupSchema.safeParse(data);
  if (!parsed.success) {
    throw parsed.error;
  }

  await verifyGroupAdmin(conversationId, userId);

  const updates: Partial<{
    groupName: string;
    groupDescription: string | null;
    groupAvatar: string | null;
  }> = {};
  if (data.name !== undefined) updates.groupName = data.name;
  if (data.description !== undefined) updates.groupDescription = data.description;
  if (data.avatar !== undefined) updates.groupAvatar = data.avatar;

  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  return { conversation: conversationDTO(conversation) };
}

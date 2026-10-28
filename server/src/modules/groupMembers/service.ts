import { Conversation } from '../conversations/model.js';
import { GroupMember } from './model.js';
import { User } from '../auth/model.js';
import { AppError } from '../../middleware/error.js';

export interface GroupMemberDTO {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  displayName?: string;
  avatar?: string | null;
}

/**
 * Verify the user is a member of the group conversation and return it.
 */
export async function verifyGroupMember(
  conversationId: string,
  userId: string
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }
  if (conversation.type !== 'group') {
    throw new AppError('Not a group conversation', 400, 'NOT_A_GROUP');
  }

  const isParticipant = conversation.participantIds.some(
    (id) => id.toString() === userId
  );
  if (!isParticipant) {
    throw new AppError('Not a member of this group', 403, 'FORBIDDEN');
  }

  return conversation;
}

/**
 * Verify the user is the admin of the group conversation.
 */
export async function verifyGroupAdmin(
  conversationId: string,
  userId: string
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }
  if (conversation.type !== 'group') {
    throw new AppError('Not a group conversation', 400, 'NOT_A_GROUP');
  }
  if (!conversation.creatorId || conversation.creatorId.toString() !== userId) {
    throw new AppError('Only the group admin can perform this action', 403, 'FORBIDDEN');
  }

  return conversation;
}

/**
 * Add a member to a group. Admin only. The user must exist.
 */
export async function addMember(
  conversationId: string,
  adminId: string,
  userId: string
) {
  await verifyGroupAdmin(conversationId, adminId);

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const existing = await GroupMember.findOne({
    conversationId,
    userId,
  });
  if (existing) {
    throw new AppError('User is already a member', 409, 'ALREADY_MEMBER');
  }

  // Add to conversation participant list and membership table atomically.
  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { $addToSet: { participantIds: userId } },
    { new: true }
  );
  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  const member = await GroupMember.create({
    conversationId,
    userId,
    role: 'member',
  });

  return {
    member: {
      userId: member.userId.toString(),
      role: member.role,
      joinedAt: member.joinedAt,
    },
  };
}

/**
 * Remove a member from a group. Admin only (or the member can leave themselves).
 */
export async function removeMember(
  conversationId: string,
  actorId: string,
  userId: string
) {
  const isSelf = actorId === userId;

  if (!isSelf) {
    await verifyGroupAdmin(conversationId, actorId);
  } else {
    // Leaving yourself requires being a member.
    await verifyGroupMember(conversationId, userId);
  }

  // Cannot remove the group creator/admin via removeMember — use changeRole or
  // the group must keep at least one admin.
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  const isCreator =
    conversation.creatorId && conversation.creatorId.toString() === userId;
  if (isCreator) {
    throw new AppError(
      'The group creator cannot be removed. Transfer admin first.',
      400,
      'CANNOT_REMOVE_CREATOR'
    );
  }

  await Conversation.findByIdAndUpdate(conversationId, {
    $pull: { participantIds: userId },
  });

  await GroupMember.deleteOne({ conversationId, userId });

  return { removed: true };
}

/**
 * Leave a group (self-remove).
 */
export async function leaveGroup(conversationId: string, userId: string) {
  return removeMember(conversationId, userId, userId);
}

/**
 * Change a member's role. Admin only. Cannot demote the last admin.
 */
export async function changeMemberRole(
  conversationId: string,
  adminId: string,
  userId: string,
  role: 'admin' | 'member'
) {
  await verifyGroupAdmin(conversationId, adminId);

  if (role === 'member') {
    const adminCount = await GroupMember.countDocuments({
      conversationId,
      role: 'admin',
    });
    const target = await GroupMember.findOne({ conversationId, userId });
    if (adminCount <= 1 && target?.role === 'admin') {
      throw new AppError(
        'A group must have at least one admin',
        400,
        'CANNOT_REMOVE_LAST_ADMIN'
      );
    }
  }

  const member = await GroupMember.findOneAndUpdate(
    { conversationId, userId },
    { role },
    { new: true }
  );
  if (!member) {
    throw new AppError('User is not a member of this group', 404, 'NOT_A_MEMBER');
  }

  return {
    member: {
      userId: member.userId.toString(),
      role: member.role,
      joinedAt: member.joinedAt,
    },
  };
}

/**
 * List members of a group conversation.
 */
export async function listMembers(conversationId: string, userId: string) {
  await verifyGroupMember(conversationId, userId);

  const members = await GroupMember.find({ conversationId }).sort({
    joinedAt: 1,
  });

  // Fetch user info for all members
  const userIds = [...new Set(members.map((m) => m.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } }).select('displayName avatar').lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), { displayName: u.displayName, avatar: u.avatar }]));

  return {
    members: members.map((m) => {
      const userInfo = userMap.get(m.userId.toString());
      return {
        userId: m.userId.toString(),
        role: m.role,
        joinedAt: m.joinedAt,
        displayName: userInfo?.displayName,
        avatar: userInfo?.avatar ?? undefined,
      };
    }),
  };
}

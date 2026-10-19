import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type GroupMemberRole = 'admin' | 'member';

export interface IGroupMember extends Document {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: GroupMemberRole;
  joinedAt: Date;
}

export type GroupMemberModel = Model<IGroupMember>;

const groupMemberSchema = new Schema<IGroupMember, GroupMemberModel>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true }
);

// A user can only be a member of a conversation once.
groupMemberSchema.index(
  { conversationId: 1, userId: 1 },
  { unique: true }
);

export const GroupMember = mongoose.model<
  IGroupMember,
  GroupMemberModel
>('GroupMember', groupMemberSchema);

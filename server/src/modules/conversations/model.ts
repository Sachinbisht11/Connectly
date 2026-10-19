import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type ConversationType = 'direct' | 'group';

export interface IConversation extends Document {
  type: ConversationType;
  participantIds: Types.ObjectId[];
  // Group-only fields (null for direct conversations).
  groupName?: string | null;
  groupDescription?: string | null;
  groupAvatar?: string | null;
  creatorId?: Types.ObjectId | null;
  lastMessageId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationModel = Model<IConversation>;

const conversationSchema = new Schema<IConversation, ConversationModel>(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    participantIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: (ids: Types.ObjectId[]) => ids.length >= 2,
        message: 'A conversation must have at least 2 participants',
      },
    },
    groupName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    groupDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    groupAvatar: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

// Index for efficient lookups of a user's conversations.
conversationSchema.index({ participantIds: 1, type: 1 });

export const Conversation = mongoose.model<IConversation, ConversationModel>('Conversation', conversationSchema);

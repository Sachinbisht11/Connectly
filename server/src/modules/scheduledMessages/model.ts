import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type ScheduledMessageStatus = 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface IScheduledMessage extends Document {
  senderId: Types.ObjectId;
  conversationId: Types.ObjectId;
  content: string;
  scheduledAt: Date;
  status: ScheduledMessageStatus;
  claimedAt?: Date;
  sentMessageId?: Types.ObjectId;
  attemptCount: number;
  lastError?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ScheduledMessageModel = Model<IScheduledMessage>;

const scheduledMessageSchema = new Schema<IScheduledMessage, ScheduledMessageModel>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 4000,
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'processing', 'sent', 'failed', 'cancelled'],
      default: 'scheduled',
      required: true,
      index: true,
    },
    claimedAt: { type: Date },
    sentMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    attemptCount: { type: Number, default: 0 },
    lastError: { type: String },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient polling of due messages
scheduledMessageSchema.index({ status: 1, scheduledAt: 1 });

export const ScheduledMessage = mongoose.model<IScheduledMessage, ScheduledMessageModel>('ScheduledMessage', scheduledMessageSchema);
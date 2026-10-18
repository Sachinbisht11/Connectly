import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type MessageType = 'text';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: MessageType;
  textContent: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageModel = Model<IMessage>;

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['text'],
      default: 'text',
    },
    textContent: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 4000,
    },
  },
  { timestamps: true }
);

// Index for paginated history: conversation + creation time.
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage, MessageModel>('Message', messageSchema);

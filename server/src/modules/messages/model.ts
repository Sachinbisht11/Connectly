import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type MessageType = 'text' | 'image' | 'file' | 'video';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: MessageType;
  textContent: string;
  // Optional media attachment.
  mediaId?: Types.ObjectId;        // ref: Media
  mediaUrl?: string;               // denormalized public URL for rendering
  mediaFilename?: string;
  mediaOriginalName?: string;
  mediaMimeType?: string;
  mediaSize?: number;
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
      enum: ['text', 'image', 'file', 'video'],
      default: 'text',
    },
    textContent: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
    // Optional media attachment.
    mediaId: { type: Schema.Types.ObjectId, ref: 'Media' },
    mediaUrl: { type: String },
    mediaFilename: { type: String },
    mediaOriginalName: { type: String },
    mediaMimeType: { type: String },
    mediaSize: { type: Number, min: 0 },
  },
  { timestamps: true }
);

// Index for paginated history: conversation + creation time.
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage, MessageModel>('Message', messageSchema);

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type MediaType = 'image' | 'file' | 'video';

export interface IMedia extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  filename: string;      // stored filename on disk
  originalName: string;  // user-facing original filename
  mimeType: string;
  size: number;          // bytes
  url: string;           // public serving URL
  createdAt: Date;
  updatedAt: Date;
}

export type MediaModel = Model<IMedia>;

const mediaSchema = new Schema<IMedia, MediaModel>(
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
    },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

export const Media = mongoose.model<IMedia, MediaModel>('Media', mediaSchema);

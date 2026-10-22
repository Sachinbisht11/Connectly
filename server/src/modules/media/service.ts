import { Media, type IMedia } from './model';
import { Conversation } from '../conversations/model';
import { AppError } from '../../middleware/error';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

/**
 * Ensure the uploads directory exists on module load.
 */
export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Store an uploaded file on disk and create a Media record.
 * `file` is a multer `Express.Multer.File` object.
 */
export async function saveMedia(
  conversationId: string,
  senderId: string,
  file: Express.Multer.File
): Promise<IMedia> {
  // Verify the conversation exists and the sender is a participant.
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

  const media = await Media.create({
    conversationId,
    senderId,
    filename: path.basename(file.path),
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    // Authorized media-serving route (enforces membership); _id is generated
    // by create() so we set url right after.
    url: `/api/conversations/media/placeholder`,
  });

  media.url = `/api/conversations/media/${media._id.toString()}`;
  await media.save();

  return media;
}

/**
 * Get a media record by id after verifying the user is a member of its
 * conversation. Returns the media document and the absolute file path.
 */
export async function getMediaWithAccess(
  mediaId: string,
  userId: string
): Promise<{ media: IMedia; filePath: string }> {
  let media;
  try {
    media = await Media.findById(mediaId);
  } catch {
    throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');
  }
  if (!media) {
    throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');
  }

  const conversation = await Conversation.findById(media.conversationId);
  if (!conversation) {
    throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');
  }

  const isParticipant = conversation.participantIds.some(
    (id) => id.toString() === userId
  );
  if (!isParticipant) {
    throw new AppError('Not a participant of this conversation', 403, 'FORBIDDEN');
  }

  const filePath = path.join(UPLOAD_DIR, media.filename);

  return { media, filePath };
}

export { UPLOAD_DIR };

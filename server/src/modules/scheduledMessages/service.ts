import { Server } from 'socket.io';
import { ScheduledMessage, type IScheduledMessage, ScheduledMessageStatus } from './model';
import { Conversation } from '../conversations/model';
import { sendMessage } from '../messages/service';
import { AppError } from '../../middleware/error';
import { Types } from 'mongoose';

export interface ScheduledMessageDTO {
  id: string;
  conversationId: string;
  content: string;
  scheduledAt: Date;
  status: ScheduledMessageStatus;
  claimedAt?: Date;
  sentMessageId?: string;
  attemptCount: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduledMessageInput {
  senderId: string;
  conversationId: string;
  content: string;
  scheduledAt: Date;
}

export interface UpdateScheduledMessageInput {
  content?: string;
  scheduledAt?: Date;
}

function toDTO(msg: IScheduledMessage): ScheduledMessageDTO {
  return {
    id: msg._id.toString(),
    conversationId: msg.conversationId.toString(),
    content: msg.content,
    scheduledAt: msg.scheduledAt,
    status: msg.status,
    claimedAt: msg.claimedAt,
    sentMessageId: msg.sentMessageId?.toString(),
    attemptCount: msg.attemptCount,
    lastError: msg.lastError,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  };
}

/**
 * Create a new scheduled message.
 * Validates that the sender is a participant of the conversation.
 * Enforces scheduledAt is in the future.
 */
export async function createScheduledMessage(input: CreateScheduledMessageInput): Promise<ScheduledMessageDTO> {
  const { senderId, conversationId, content, scheduledAt } = input;

  // Validate scheduledAt is in the future
  const now = new Date();
  console.log('[ScheduledMessage] createScheduledMessage:', { scheduledAt: scheduledAt.toISOString(), now: now.toISOString(), isFuture: scheduledAt > now });
  if (scheduledAt <= now) {
    throw new AppError('Scheduled time must be in the future', 400, 'INVALID_SCHEDULE_TIME');
  }

  // Verify conversation exists and sender is a participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  const isParticipant = conversation.participantIds.some(
    (id) => id.toString() === senderId
  );
  if (!isParticipant) {
    throw new AppError('Not a participant of this conversation', 403, 'FORBIDDEN');
  }

  // Generate idempotency key: senderId + conversationId + scheduledAt + content hash
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256')
    .update(`${senderId}:${conversationId}:${scheduledAt.toISOString()}:${content}`)
    .digest('hex')
    .slice(0, 16);
  const idempotencyKey = `${senderId}:${conversationId}:${scheduledAt.getTime()}:${hash}`;

  // Check for existing scheduled message with same idempotency key (duplicate prevention)
  const existing = await ScheduledMessage.findOne({ idempotencyKey });
  if (existing) {
    return toDTO(existing);
  }

  const scheduledMessage = await ScheduledMessage.create({
    senderId,
    conversationId,
    content,
    scheduledAt,
    status: 'scheduled',
    attemptCount: 0,
    idempotencyKey,
  });

  return toDTO(scheduledMessage);
}

/**
 * List scheduled messages for the current user (sender).
 * Supports cursor-based pagination and optional status filter.
 */
export async function listScheduledMessages(
  senderId: string,
  opts: { status?: ScheduledMessageStatus; limit?: number; cursor?: string }
): Promise<{ messages: ScheduledMessageDTO[]; hasMore: boolean; nextCursor?: string }> {
  const { status, limit = 50, cursor } = opts;

  const filter: Record<string, unknown> = { senderId: new Types.ObjectId(senderId) };
  if (status) filter['status'] = status;
  if (cursor) {
    filter['_id'] = { $lt: new Types.ObjectId(cursor) };
  }

  const messages = await ScheduledMessage.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  return {
    messages: messages.map((msg: any) => toDTO(msg)),
    hasMore,
    nextCursor: hasMore ? messages[messages.length - 1]._id.toString() : undefined,
  };
}

/**
 * Get a single scheduled message by ID (must belong to sender).
 */
export async function getScheduledMessage(
  scheduledMessageId: string,
  senderId: string
): Promise<ScheduledMessageDTO> {
  let scheduledMessage;
  try {
    scheduledMessage = await ScheduledMessage.findById(scheduledMessageId);
  } catch {
    throw new AppError('Scheduled message not found', 404, 'NOT_FOUND');
  }
  if (!scheduledMessage) {
    throw new AppError('Scheduled message not found', 404, 'NOT_FOUND');
  }
  if (scheduledMessage.senderId.toString() !== senderId) {
    throw new AppError('Not authorized to view this scheduled message', 403, 'FORBIDDEN');
  }
  return toDTO(scheduledMessage);
}

/**
 * Update a scheduled message (content or scheduledAt).
 * Only allowed if status is 'scheduled' (not processing/sent/cancelled).
 */
export async function updateScheduledMessage(
  scheduledMessageId: string,
  senderId: string,
  input: UpdateScheduledMessageInput
): Promise<ScheduledMessageDTO> {
  const scheduledMessage = await ScheduledMessage.findById(scheduledMessageId);
  if (!scheduledMessage) {
    throw new AppError('Scheduled message not found', 404, 'NOT_FOUND');
  }
  if (scheduledMessage.senderId.toString() !== senderId) {
    throw new AppError('Not authorized to update this scheduled message', 403, 'FORBIDDEN');
  }
  if (scheduledMessage.status !== 'scheduled') {
    throw new AppError('Cannot update a message that is no longer pending', 400, 'INVALID_STATUS');
  }

  if (input.scheduledAt) {
    const newTime = new Date(input.scheduledAt);
    if (newTime <= new Date()) {
      throw new AppError('Scheduled time must be in the future', 400, 'INVALID_SCHEDULE_TIME');
    }
    scheduledMessage.scheduledAt = newTime;
  }
  if (input.content !== undefined) {
    scheduledMessage.content = input.content;
  }

  await scheduledMessage.save();
  return toDTO(scheduledMessage);
}

/**
 * Cancel a scheduled message.
 * Only allowed if status is 'scheduled' (not processing/sent).
 */
export async function cancelScheduledMessage(
  scheduledMessageId: string,
  senderId: string
): Promise<ScheduledMessageDTO> {
  const scheduledMessage = await ScheduledMessage.findById(scheduledMessageId);
  if (!scheduledMessage) {
    throw new AppError('Scheduled message not found', 404, 'NOT_FOUND');
  }
  if (scheduledMessage.senderId.toString() !== senderId) {
    throw new AppError('Not authorized to cancel this scheduled message', 403, 'FORBIDDEN');
  }
  if (scheduledMessage.status !== 'scheduled') {
    throw new AppError('Cannot cancel a message that is no longer pending', 400, 'INVALID_STATUS');
  }

  scheduledMessage.status = 'cancelled';
  await scheduledMessage.save();
  return toDTO(scheduledMessage);
}

/**
 * Worker function: claim and process due scheduled messages.
 * Uses atomic findOneAndUpdate to claim messages (status: scheduled -> processing).
 * Idempotent: each message is processed at most once even if retried.
 *
 * @param io - Socket.IO server instance used to broadcast `message:new` to the
 * conversation room so clients see the scheduled message without refreshing.
 */
export async function processDueScheduledMessages(io?: Server): Promise<number> {
  const now = new Date();
  let processed = 0;

  while (true) {
    // Atomically claim one due scheduled message
    const claimed = await ScheduledMessage.findOneAndUpdate(
      {
        status: 'scheduled',
        scheduledAt: { $lte: now },
      },
      {
        $set: {
          status: 'processing',
          claimedAt: new Date(),
        },
        $inc: { attemptCount: 1 },
      },
      { new: true }
    );

    if (!claimed) break; // No more due messages

    try {
      // Verify conversation still exists and sender is still a participant
      const conversation = await Conversation.findById(claimed.conversationId);
      if (!conversation) {
        throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
      }

      const isParticipant = conversation.participantIds.some(
        (id) => id.toString() === claimed.senderId.toString()
      );
      if (!isParticipant) {
        throw new AppError('Sender no longer a participant', 403, 'FORBIDDEN');
      }

      // Send the message using the same service as real-time messages
      const { message } = await sendMessage(
        claimed.conversationId.toString(),
        claimed.senderId.toString(),
        { textContent: claimed.content }
      );

      // Mark as sent with the message ID
      claimed.status = 'sent';
      claimed.sentMessageId = new Types.ObjectId(message.id);
      claimed.lastError = undefined;
      await claimed.save();
      processed++;

      // Broadcast to the conversation room so clients see it live (no refresh).
      const broadcast = {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        sender: message.sender,
        type: message.type,
        textContent: message.textContent,
        media: message.media,
        createdAt: message.createdAt.toISOString(),
      };
      io?.to(claimed.conversationId.toString()).emit('message:new', broadcast);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      claimed.status = 'failed';
      claimed.lastError = errorMessage;
      await claimed.save();
      // Continue to next message
    }
  }

  return processed;
}

/**
 * Get scheduled message count by status for a sender.
 */
export async function getScheduledMessageCounts(senderId: string): Promise<Record<ScheduledMessageStatus, number>> {
  const counts = await ScheduledMessage.aggregate([
    { $match: { senderId: new Types.ObjectId(senderId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const result: Partial<Record<ScheduledMessageStatus, number>> = {
    scheduled: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  };

  for (const c of counts) {
    const status = c._id as ScheduledMessageStatus;
    result[status] = c.count;
  }

  return result as Record<ScheduledMessageStatus, number>;
}
import { api } from '../../lib/api';

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  groupName?: string | null;
  groupDescription?: string | null;
  groupAvatar?: string | null;
  creatorId?: string | null;
  participantIds: string[];
  lastMessageId?: string | null;
  lastMessageContent?: string;
  lastMessageTime?: string;
  lastMessageSenderId?: string;
  createdAt: string;
  updatedAt: string;
  otherParticipantName?: string;
  otherParticipantAvatar?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: {
    id: string;
    displayName: string;
    avatar?: string | null;
  };
  type: 'text' | 'image' | 'file' | 'video';
  textContent: string;
  media?: {
    id: string;
    url: string;
    filename?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageInput {
  textContent: string;
  media?: {
    type: 'image' | 'file' | 'video';
    url: string;
    filename?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
  };
}

/**
 * Attach a media file to a conversation (multipart upload).
 * Returns the created message including its media field.
 */
export async function sendMedia(
  conversationId: string,
  file: File
): Promise<Message> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api/conversations/${conversationId}/media`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');

  const data = (await res.json()) as { message: Message };
  return data.message;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface MessageResponse {
  message: Message;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  participantIds: string[];
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  avatar?: string | null;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

/**
 * List conversations the current user participates in.
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const res = await api.get<ConversationsResponse>('/api/conversations');
  return res.data.conversations;
}

/**
 * Create or find a direct conversation with another user.
 */
export async function createOrFindConversation(
  participantId: string
): Promise<{ conversation: Conversation; created: boolean }> {
  const res = await api.post<{ conversation: Conversation; created: boolean }>(
    '/api/conversations',
    { participantId }
  );
  return res.data;
}

/**
 * Create a new group conversation.
 */
export async function createGroupConversation(
  input: CreateGroupInput
): Promise<{ conversation: Conversation }> {
  const res = await api.post<{ conversation: Conversation }>(
    '/api/conversations/group',
    input
  );
  return res.data;
}

/**
 * Update group metadata.
 */
export async function updateGroupConversation(
  conversationId: string,
  input: UpdateGroupInput
): Promise<{ conversation: Conversation }> {
  const res = await api.patch<{ conversation: Conversation }>(
    `/api/conversations/${conversationId}/group`,
    input
  );
  return res.data;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  displayName?: string;
  avatar?: string | null;
}

export interface MembersResponse {
  members: GroupMember[];
}

export interface AddMemberInput {
  userId: string;
}

export interface ChangeRoleInput {
  role: 'admin' | 'member';
}

/**
 * List members of a group conversation.
 */
export async function fetchGroupMembers(
  conversationId: string
): Promise<GroupMember[]> {
  const res = await api.get<MembersResponse>(
    `/api/conversations/${conversationId}/members`
  );
  return res.data.members;
}

/**
 * Add a member to a group conversation (admin only).
 */
export async function addGroupMember(
  conversationId: string,
  input: AddMemberInput
): Promise<{ member: GroupMember }> {
  const res = await api.post<{ member: GroupMember }>(
    `/api/conversations/${conversationId}/members`,
    input
  );
  return res.data;
}

/**
 * Remove a member from a group conversation (admin only, or self).
 */
export async function removeGroupMember(
  conversationId: string,
  userId: string
): Promise<{ removed: boolean }> {
  const res = await api.delete<{ removed: boolean }>(
    `/api/conversations/${conversationId}/members/${userId}`
  );
  return res.data;
}

/**
 * Leave a group conversation.
 */
export async function leaveGroupConversation(
  conversationId: string
): Promise<{ left: boolean }> {
  const res = await api.post<{ left: boolean }>(
    `/api/conversations/${conversationId}/members/leave`
  );
  return res.data;
}

/**
 * Change a member's role (admin only).
 */
export async function changeGroupMemberRole(
  conversationId: string,
  userId: string,
  input: ChangeRoleInput
): Promise<{ member: GroupMember }> {
  const res = await api.patch<{ member: GroupMember }>(
    `/api/conversations/${conversationId}/members/${userId}/role`,
    input
  );
  return res.data;
}

/**
 * Send a text message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  input: SendMessageInput
): Promise<Message> {
  const res = await api.post<MessageResponse>(
    `/api/conversations/${conversationId}/messages`,
    input
  );
  return res.data.message;
}

/**
 * Fetch paginated message history for a conversation.
 * `before` is a message id to load messages older than it.
 */
export async function fetchMessages(
  conversationId: string,
  opts?: { limit?: number; before?: string }
): Promise<MessagesResponse> {
  const res = await api.get<MessagesResponse>(`/api/conversations/${conversationId}/messages`, {
    params: opts,
  });
  return res.data;
}

/* ────────────────────────── Scheduled Messages ────────────────────────── */

export type ScheduledMessageStatus = 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface ScheduledMessage {
  id: string;
  conversationId: string;
  content: string;
  scheduledAt: string;
  status: ScheduledMessageStatus;
  claimedAt?: string;
  sentMessageId?: string;
  attemptCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledMessagesResponse {
  messages: ScheduledMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ScheduledMessageCounts {
  scheduled: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
}

export interface CreateScheduledMessageInput {
  conversationId: string;
  content: string;
  scheduledAt: string; // ISO 8601 with timezone
}

export interface UpdateScheduledMessageInput {
  content?: string;
  scheduledAt?: string;
}

/**
 * List the current user's scheduled messages.
 */
export async function fetchScheduledMessages(opts?: {
  status?: ScheduledMessageStatus;
  limit?: number;
  cursor?: string;
}): Promise<ScheduledMessagesResponse> {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.cursor) params.set('cursor', opts.cursor);

  const res = await api.get<ScheduledMessagesResponse>(`/api/scheduled-messages?${params.toString()}`);
  return res.data;
}

/**
 * Get scheduled message counts by status.
 */
export async function fetchScheduledMessageCounts(): Promise<ScheduledMessageCounts> {
  const res = await api.get<{ counts: ScheduledMessageCounts }>('/api/scheduled-messages/counts');
  return res.data.counts;
}

/**
 * Create a new scheduled message.
 */
export async function createScheduledMessage(input: CreateScheduledMessageInput): Promise<ScheduledMessage> {
  const res = await api.post<{ scheduledMessage: ScheduledMessage }>('/api/scheduled-messages', input);
  return res.data.scheduledMessage;
}

/**
 * Get a single scheduled message by ID.
 */
export async function fetchScheduledMessage(scheduledMessageId: string): Promise<ScheduledMessage> {
  const res = await api.get<{ scheduledMessage: ScheduledMessage }>(`/api/scheduled-messages/${scheduledMessageId}`);
  return res.data.scheduledMessage;
}

/**
 * Update a scheduled message (content or scheduledAt).
 */
export async function updateScheduledMessage(
  scheduledMessageId: string,
  input: UpdateScheduledMessageInput
): Promise<ScheduledMessage> {
  const res = await api.patch<{ scheduledMessage: ScheduledMessage }>(
    `/api/scheduled-messages/${scheduledMessageId}`,
    input
  );
  return res.data.scheduledMessage;
}

/**
 * Cancel a scheduled message.
 */
export async function cancelScheduledMessage(scheduledMessageId: string): Promise<ScheduledMessage> {
  const res = await api.delete<{ scheduledMessage: ScheduledMessage }>(`/api/scheduled-messages/${scheduledMessageId}`);
  return res.data.scheduledMessage;
}

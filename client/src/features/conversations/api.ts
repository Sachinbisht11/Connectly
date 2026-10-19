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
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text';
  textContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageInput {
  textContent: string;
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

/**
 * List conversations the current user participates in.
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const res = await api.get<ConversationsResponse>('/api/conversations');
  return res.data.conversations;
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

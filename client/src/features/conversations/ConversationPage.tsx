import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  fetchMessages,
  sendMessage,
  sendMedia,
  fetchConversations,
  fetchGroupMembers,
  createScheduledMessage,
  type Conversation,
  type Message,
  type GroupMember,
} from './api';
import { getSocket } from '../../lib/socket';
import { useSidebar } from '../../components/Sidebar';

export interface ConversationPageProps {
  children?: ReactNode;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const { toggle: toggleSidebar } = useSidebar();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const attachRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const receivedMessageIds = useRef<Set<string>>(new Set());
  const userScrolledUpRef = useRef(false);

  const scrollToBottom = () => {
    void messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    // Consider user "at bottom" if within 100px of the bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    userScrolledUpRef.current = !isNearBottom;
  };

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError('');
    try {
      // Prefer the conversation passed in route state (from the list).
      const stateConv = (location.state as { conversation?: Conversation })?.conversation;
      if (stateConv && stateConv.id === conversationId) {
        setConversation(stateConv);
      } else {
        // Fall back to looking it up in the conversations list (direct URL).
        const data = await fetchConversations();
        const found = data.find((c: Conversation) => c.id === conversationId);
        setConversation(found || null);
      }

      const data = await fetchMessages(conversationId, { limit: 50 });
      setMessages(data.messages);
      receivedMessageIds.current = new Set(data.messages.map((m) => m.id));
      // Reset scroll tracking on initial load
      userScrolledUpRef.current = false;

      // Fetch group members if it's a group
      if (conversation?.type === 'group') {
        try {
          const membersData = await fetchGroupMembers(conversationId);
          setMembers(membersData);
        } catch {
          // Ignore member fetch errors
        }
      }

      void scrollToBottom();
    } catch {
      setError('Unable to load conversation or messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, location.state, conversation]);

  // Connect and join the conversation room when the page mounts.
  useEffect(() => {
    if (!conversationId || !token) return;

    socketRef.current = getSocket(token);
    const socket = socketRef.current;
    if (!socket) return;
    socket.connect();
    socket.emit('message:join', { conversationId });

    // Receive new messages broadcast to this conversation room.
    const onNewMessage = (message: Message) => {
      // Dedupe: a message sent by us arrives both via the REST response and the
      // socket broadcast. Ignore the broadcast if we already have the id.
      if (receivedMessageIds.current.has(message.id)) return;
      setMessages((prev) => [...prev, message]);
      receivedMessageIds.current.add(message.id);
      // Only auto-scroll if user is at or near the bottom
      if (!userScrolledUpRef.current) {
        void scrollToBottom();
      }
    };
    socket.on('message:new', onNewMessage);

    void loadConversation();

    return () => {
      socket.off('message:new', onNewMessage);
      socket.emit('message:leave', { conversationId });
      // Keep the socket alive across page navigations within the app; only
      // disconnect on logout (handled in AuthContext/logout via disconnectSocket).
    };
  }, [conversationId, token, loadConversation]);

  useEffect(() => {
    // Only auto-scroll if user is at or near the bottom
    if (!userScrolledUpRef.current) {
      void scrollToBottom();
    }
  }, [messages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !user || !input.trim()) return;

    setError('');
    setSending(true);
    try {
      const message = await sendMessage(conversationId, {
        textContent: input.trim(),
      });
      setMessages((prev) => [...prev, message]);
      receivedMessageIds.current.add(message.id);
      setInput('');
      // Only auto-scroll if user is at or near the bottom
      if (!userScrolledUpRef.current) {
        void scrollToBottom();
      }
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const onAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!conversationId || !user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSendingMedia(true);
    try {
      const message = await sendMedia(conversationId, file);
      setMessages((prev) => [...prev, message]);
      receivedMessageIds.current.add(message.id);
      // Only auto-scroll if user is at or near the bottom
      if (!userScrolledUpRef.current) {
        void scrollToBottom();
      }
    } catch {
      setError('Failed to attach file. Please try again.');
    } finally {
      setSendingMedia(false);
      e.target.value = '';
    }
  };

  const scheduleMessage = async () => {
    if (!conversationId || !user || !scheduleTime || !input.trim()) return;
    setError('');
    setScheduling(true);
    try {
      await createScheduledMessage({
        conversationId,
        content: input.trim(),
        scheduledAt: new Date(scheduleTime).toISOString(),
      });
      setInput('');
      setScheduleTime('');
      setScheduleDialogOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to schedule message. Please try again.';
      setError(message);
    } finally {
      setScheduling(false);
    }
  };

  const getConversationTitle = (): string => {
    if (!conversation) return 'Conversation';

    if (conversation.type === 'group') {
      return conversation.groupName || 'Group Chat';
    }

    // For direct conversations, use otherParticipantName from the backend
    if (conversation.otherParticipantName) {
      return conversation.otherParticipantName;
    }

    // Fallback: if we have members, use the first non-current user
    const otherMember = members.find((m) => m.userId !== user?.id);
    if (otherMember) {
      return `User ${otherMember.userId.slice(-6)}`;
    }

    return 'Conversation';
  };

  const getConversationSubtitle = (): string => {
    if (!conversation) return '';

    if (conversation.type === 'group') {
      return `${members.length} members`;
    }

    return 'Direct message';
  };

  const getConversationAvatar = (): string | null => {
    if (!conversation) return null;

    if (conversation.type === 'group') {
      return conversation.groupAvatar || null;
    }

    // For direct conversations, find the other participant's avatar
    const otherMember = members.find((m) => m.userId !== user?.id);
    if (otherMember?.avatar) {
      return otherMember.avatar;
    }

    // Check messages for sender avatar
    const otherParticipant = messages.find(
      (m) => m.senderId !== user?.id && m.sender?.avatar
    );
    if (otherParticipant?.sender?.avatar) {
      return otherParticipant.sender.avatar;
    }

    return null;
  };

  const renderMessage = (m: Message, index: number) => {
    const isMine = m.senderId === user?.id;
    // const showTimestamp = index === messages.length - 1 ||
    //   (messages[index + 1]?.senderId !== m.senderId);
    const showTimestamp = true; // Always show timestamp for clarity
    const isGroup = conversation?.type === 'group';
    const senderName = m.sender?.displayName || `User ${m.senderId.slice(-6)}`;

    // For group conversations, show sender name for incoming messages
    const showSenderName = isGroup && !isMine;

    if (m.type === 'image' && m.media?.url) {
      const media = m.media;
      return (
        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
          <div className={`max-w-[70%] ${isMine ? '' : ''}`}>
            {showSenderName && (
              <p className="text-xs text-slate-500 ml-1 mb-1">{senderName}</p>
            )}
            <button
              type="button"
              onClick={() => void window.open(media.url, '_blank')}
              className="block"
            >
              <img
                src={media.url}
                alt={media.originalName || 'Image'}
                className="max-w-full max-h-[300px] rounded-xl object-cover"
                loading="lazy"
              />
            </button>
            {media.originalName && (
              <p className="text-[10px] text-slate-400 mt-1 text-right">
                {media.originalName}
              </p>
            )}
            {showTimestamp && (
              <p className={`text-[10px] mt-1 ${isMine ? 'text-[#667781]-300' : 'text-[#8696A0]-400'} text-right`}>
                {formatTime(m.createdAt)}
                {isMine && <span className="ml-1 text-blue-500">✓✓</span>}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (m.type === 'file' && m.media?.url) {
      const media = m.media;
      const isPdf = media.mimeType === 'application/pdf' || media.originalName?.toLowerCase().endsWith('.pdf');
      return (
        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
          <div className={`max-w-[70%] ${isMine ? '' : ''}`}>
            {showSenderName && (
              <p className="text-xs text-slate-500 ml-1 mb-1">{senderName}</p>
            )}
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3 rounded-xl ${
                isMine
                  ? 'bg-green-100 border border-green-200'
                  : 'bg-slate-100 border border-slate-200'
              }`}
            >
              {isPdf ? (
                <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 0l6 6h-6v-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V8h8v2z"/>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-slate-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 0l6 6h-6v-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V8h8v2z"/>
                </svg>
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isMine ? 'text-slate-900' : 'text-slate-900'}`}>
                  {media.originalName || 'Attachment'}
                </p>
                {media.size && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatFileSize(media.size)}
                  </p>
                )}
              </div>
            </a>
            {showTimestamp && (
              <p className={`text-[10px] mt-1 ${isMine ? 'text-[#667781]-300' : 'text-[#8696A0]-400'} text-right`}>
                {formatTime(m.createdAt)}
                {isMine && <span className="ml-1 text-blue-500">✓✓</span>}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (m.type === 'video' && m.media?.url) {
      const media = m.media;
      return (
        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
          <div className={`max-w-[70%] ${isMine ? '' : ''}`}>
            {showSenderName && (
              <p className="text-xs text-slate-500 ml-1 mb-1">{senderName}</p>
            )}
            <video
              src={media.url}
              controls
              className="max-w-full max-h-[300px] rounded-xl"
            />
            {media.originalName && (
              <p className="text-[10px] text-slate-400 mt-1 text-right">
                {media.originalName}
              </p>
            )}
            {showTimestamp && (
              <p className={`text-[10px] mt-1 ${isMine ? 'text-[#667781]-300' : 'text-[#8696A0]-400'} text-right`}>
                {formatTime(m.createdAt)}
                {isMine && <span className="ml-1 text-blue-500">✓✓</span>}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Voice/audio message
    if (m.type === 'file' && m.media?.mimeType?.startsWith('audio/')) {
      return (
        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
          <div className={`max-w-[70%] ${isMine ? '' : ''}`}>
            {showSenderName && (
              <p className="text-xs text-slate-500 ml-1 mb-1">{senderName}</p>
            )}
            <div className={`flex items-center gap-3 p-3 rounded-2xl ${
              isMine
                ? 'bg-green-200'
                : 'bg-slate-100'
            }`}>
              <button className={`p-2 rounded-full ${isMine ? 'bg-green-300' : 'bg-white'} text-slate-600 flex-shrink-0`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <div className="flex-1 h-2 bg-slate-200 rounded-full relative overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: '40%' }}></div>
              </div>
              <span className="text-[11px] text-slate-500 flex-shrink-0">2:30</span>
            </div>
            {showTimestamp && (
              <p className={`text-[10px] mt-1 ${isMine ? 'text-[#667781]-300' : 'text-[#8696A0]-400'} text-right`}>
                {formatTime(m.createdAt)}
                {isMine && <span className="ml-1 text-blue-500">✓✓</span>}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`max-w-[70%] ${isMine ? '' : ''}`}>
          {showSenderName && (
            <p className="text-xs text-slate-500 ml-1 mb-1">{senderName}</p>
          )}
          <div className={`px-4 py-2 rounded-2xl ${
            isMine
              ? 'bg-green-100 rounded-br-md'
              : 'bg-slate-100 rounded-bl-md'
          }`}>
            <p className="text-sm text-slate-900 whitespace-pre-wrap">{m.textContent}</p>
            {showTimestamp && (
              <p className={`text-[10px] mt-1 ${isMine ? 'text-[#667781]-300' : 'text-[#8696A0]-400'} text-right`}>
                {formatTime(m.createdAt)}
                {isMine && <span className="ml-1 text-blue-500">✓✓</span>}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!conversationId) {
    navigate('/conversations', { replace: true });
    return null;
  }

  const displayName = getConversationTitle();
  const displaySubtitle = getConversationSubtitle();
  const conversationAvatar = getConversationAvatar();
  const participantAvatars = members.slice(0, 4).map((m) => {
    const avatarUrl = m.avatar || null;
    const initial = m.displayName ? m.displayName.charAt(0).toUpperCase() : (m.userId ? m.userId.slice(0, 1).toUpperCase() : 'U');
    return (
      <div key={m.userId} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600 overflow-hidden bg-slate-100">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
    );
  });

  return (
    <>
      <div className="flex flex-col h-screen bg-white min-w-0">
      {/* Conversation Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0 lg:hidden"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => navigate('/conversations')}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0 lg:hidden ml-1"
            aria-label="Back to conversations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative">
            {conversationAvatar ? (
              <img
                src={conversationAvatar}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-medium text-slate-600">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {conversation?.type === 'group' && (
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900 truncate">{displayName}</p>
            {conversation?.type === 'group' && members.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-slate-500">{members.length} members</span>
                <div className="flex -space-x-2 ml-1">
                  {participantAvatars}
                  {members.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-blue-700">
                      +{members.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
            {conversation?.type !== 'group' && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{displaySubtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Video call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Search in conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {/* Group Info Button (3 dots) */}
          <button
            type="button"
            onClick={() => {
              if (conversation?.type === 'group') {
                navigate(`/conversations/${conversationId}/group-info`, {
                  state: { conversation },
                });
              }
            }}
            disabled={!conversation || conversation.type !== 'group'}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="More options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50 min-h-0"
      >
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center flex-1 min-h-0 text-slate-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        {messages.map((m, index) => renderMessage(m, index))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 py-2 rounded-md bg-red-50 text-sm text-red-700 border border-red-100 mx-4 mb-4">
          {error}
        </div>
      )}

      {/* Message Composer */}
      <div className="border-t border-slate-200 bg-white p-4 flex-shrink-0">
        <div className="flex items-end gap-2">
          <label className="cursor-pointer flex-shrink-0" style={{ display: 'contents' }}>
            <button
              type="button"
              disabled={sendingMedia}
              onClick={() => attachRef.current?.click()}
              aria-label="Attach file"
              className={`p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors ${
                sendingMedia ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={attachRef}
              type="file"
              accept="image/*,video/*,application/pdf,text/plain,audio/*"
              hidden
              onChange={(e) => void onAttach(e)}
              disabled={sendingMedia}
            />
          </label>

          <form onSubmit={(e) => void onSend(e)} className="flex-1 flex items-end gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={sending || sendingMedia}
                className="w-full py-3 px-4 pr-12 border border-slate-300 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              />
              <button
                type="button"
                className="absolute right-3 bottom-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Emoji"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              disabled={sending || sendingMedia || !input.trim()}
              onClick={() => setScheduleDialogOpen(true)}
              className="flex-shrink-0 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule
            </button>

            <button
              type="button"
              disabled={sending || sendingMedia || !input.trim()}
              onClick={(e) => {
                e.preventDefault();
                void onSend(e as unknown as React.FormEvent);
              }}
              className="flex-shrink-0 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>

    {/* Schedule Message Dialog */}
    {scheduleDialogOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Schedule message</h2>
          <p className="text-sm text-slate-500 mb-4">
            The message will be sent automatically at the selected time.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="w-full py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void scheduleMessage()}
              disabled={scheduling || !scheduleTime}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {scheduling ? 'Scheduling...' : 'Schedule'}
            </button>
            <button
              type="button"
              onClick={() => setScheduleDialogOpen(false)}
              disabled={scheduling}
              className="flex-1 py-2.5 px-4 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
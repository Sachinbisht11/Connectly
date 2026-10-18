import {
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  fetchMessages,
  sendMessage,
  type Message,
} from './api';
import { getSocket } from '../../lib/socket';

export interface ConversationPageProps {
  children?: ReactNode;
}

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const receivedMessageIds = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    void messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchMessages(conversationId, { limit: 50 });
      setMessages(data.messages);
      receivedMessageIds.current = new Set(data.messages.map((m) => m.id));
      void scrollToBottom();
    } catch {
      setError('Unable to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

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
      void scrollToBottom();
    };
    socket.on('message:new', onNewMessage);

    void loadMessages();

    return () => {
      socket.off('message:new', onNewMessage);
      socket.emit('message:leave', { conversationId });
      // Keep the socket alive across page navigations within the app; only
      // disconnect on logout (handled in AuthContext/logout via disconnectSocket).
    };
  }, [conversationId, token, loadMessages]);

  useEffect(() => {
    void scrollToBottom();
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
      void scrollToBottom();
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!conversationId) {
    navigate('/search', { replace: true });
    return null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-md mx-auto py-4 px-2">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          ← Back to conversations
        </button>
        <span className="text-sm font-medium text-gray-900 truncate">
          Conversation {conversationId.slice(-6)}
        </span>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 mb-2">
          {error}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3"
        ref={messagesEndRef}
      >
        {loading && <p className="text-sm text-gray-500 text-center">Loading...</p>}

        {messages.map((m) => {
          const isMine = m.senderId === user?.id;
          return (
            <div
              key={m.id}
              className={`flex ${
                isMine ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-2 rounded-lg ${
                  isMine
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm">{m.textContent}</p>
                <p className="text-[10px] text-gray-400 mt-1 text-right">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={(e) => void onSend(e)} className="mt-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}

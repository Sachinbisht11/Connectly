import {
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { fetchConversations, type Conversation } from './api';
import { useLocation } from 'react-router-dom';

export default function ConversationsList() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch {
      setError('Unable to load conversations. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      void load();
    }
  }, [loading, user, load]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredConversations = conversations.filter((c) => {
    const name = getConversationDisplayName(c);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper to get display name for a conversation
  function getConversationDisplayName(conversation: Conversation): string {
    if (conversation.type === 'group' && conversation.groupName) {
      return conversation.groupName;
    }
    // For direct conversations, use the otherParticipantName from backend
    if (conversation.otherParticipantName) {
      return conversation.otherParticipantName;
    }
    // Fallback for older conversations without the field
    return `Conversation ${conversation.id.slice(-6)}`;
  }

  function getConversationAvatar(conversation: Conversation): string | null {
    if (conversation.type === 'group') {
      return conversation.groupAvatar || null;
    }
    return conversation.otherParticipantAvatar || null;
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Get last message preview with sender name for group chats
  function getLastMessagePreview(conversation: Conversation): { text: string; senderName?: string } {
    if (!conversation.lastMessageContent) {
      return { text: 'No messages yet' };
    }

    // For group chats, show sender name if available
    if (conversation.type === 'group' && conversation.lastMessageSenderId && conversation.lastMessageSenderId !== user?.id) {
      // In a real app, we'd fetch sender name, but for now we'll show "You" or a placeholder
      return {
        text: conversation.lastMessageContent,
        senderName: conversation.lastMessageSenderId === user?.id ? 'You' : undefined
      };
    }

    // For direct messages or when sender is current user
    if (conversation.lastMessageSenderId === user?.id) {
      return { text: `You: ${conversation.lastMessageContent}` };
    }

    return { text: conversation.lastMessageContent };
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 min-w-0">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">Chats</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="New message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Search Input */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="px-4 py-3 rounded-md bg-red-50 text-sm text-red-700 mx-3 mt-3">
            {error}
          </div>
        )}

        <ul className="divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <li className="px-4 py-12 text-center">
              <p className="text-sm text-slate-500">
                {searchQuery ? 'No conversations match your search.' : 'No conversations yet. Start one by clicking the compose button.'}
              </p>
            </li>
          ) : (
            filteredConversations.map((c) => {
              const isActive = location.pathname === `/conversations/${c.id}`;
              const displayName = getConversationDisplayName(c);
              const lastMessagePreview = getLastMessagePreview(c);
              const lastMessageTime = c.lastMessageTime ? formatTime(c.lastMessageTime) : '';

              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/conversations/${c.id}`, {
                        state: { conversation: c },
                      });
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 border-r-2 border-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600 overflow-hidden">
                        {getConversationAvatar(c) ? (
                          <img src={getConversationAvatar(c)!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      {c.type === 'group' && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-slate-900' : 'text-slate-900'}`}>
                          {displayName}
                        </p>
                        {lastMessageTime && (
                          <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                            {lastMessageTime}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate mt-0.5">
                        {lastMessagePreview.senderName ? (
                          <span className="font-medium text-slate-600">{lastMessagePreview.senderName}: </span>
                        ) : null}
                        {lastMessagePreview.text}
                      </p>
                    </div>
                    {c.type === 'group' && !isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        Group
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Create Group Dialog */}
      {createDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create group</h2>
            <p className="text-sm text-slate-500 mb-4">
              Start a group conversation with multiple people.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateDialogOpen(false);
                  navigate('/conversations/create-group');
                }}
                className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                New group chat
              </button>
              <button
                type="button"
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
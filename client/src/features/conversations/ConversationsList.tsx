import {
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { fetchConversations, type Conversation } from './api';

export default function ConversationsList() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
    return null;
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
        >
          New group
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
        >
          Start a new conversation
        </button>

        {conversations.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-6">
            No conversations yet. Start one by searching for a user.
          </p>
        )}

        <ul className="space-y-1 mt-4">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  navigate(`/conversations/${c.id}`, {
                    state: { conversation: c },
                  });
                }}
                className="w-full flex items-center justify-between p-3 border rounded-md bg-white hover:bg-gray-50 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                    {c.groupName ? c.groupName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.groupName || `Conversation ${c.id.slice(-6)}`}
                    </p>
                    {c.type === 'group' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        Group
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{c.type}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {createDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create group</h2>
            <p className="text-sm text-gray-500 mb-4">
              Start a group conversation with multiple people.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateDialogOpen(false);
                  navigate('/conversations/create-group');
                }}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                New group chat
              </button>
              <button
                type="button"
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50"
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

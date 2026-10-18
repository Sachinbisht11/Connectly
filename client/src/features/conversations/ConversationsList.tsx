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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

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
                  navigate(`/conversations/${c.id}`);
                }}
                className="w-full flex items-center justify-between p-3 border rounded-md bg-white hover:bg-gray-50 text-left"
              >
                <span className="text-sm font-medium text-gray-900">
                  Conversation {c.id.slice(-6)}
                </span>
                <span className="text-xs text-gray-400">{c.type}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

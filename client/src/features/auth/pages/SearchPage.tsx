import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { createOrFindConversation } from '../../conversations/api';

interface SearchResult {
  id: string;
  displayName: string;
  avatar: string | null | undefined;
  about: string | null | undefined;
}

export default function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}&limit=10`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as { users: SearchResult[] };
      setResults(data.users);
    } catch {
      setError('Unable to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (participantId: string) => {
    if (!user) return;
    setStarting(participantId);
    setError('');
    try {
      const res = await createOrFindConversation(participantId);
      navigate(`/conversations/${res.conversation.id}`);
    } catch {
      setError('Unable to start conversation. Please try again.');
    } finally {
      setStarting(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find people</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Search by name or email..."
          />
          <button
            type="button"
            onClick={() => {
              void search();
            }}
            disabled={loading || !query.trim()}
            className="absolute left-2 top-1/2 -mt-3 text-gray-400"
          >
            🔍
          </button>
          <button
            type="button"
            onClick={() => {
              void search();
            }}
            disabled={loading || !query.trim()}
            className="ml-2 py-2 px-4 border border-blue-600 rounded-md text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500">Searching...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {results.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-700">Results</h2>
            <ul className="space-y-2">
              {results.map((u) => (
                <li key={u.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {u.displayName}
                      </p>
                      {u.id !== user.id && (
                        <button
                          type="button"
                          onClick={() => void startConversation(u.id)}
                          disabled={starting === u.id}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-500 disabled:opacity-50"
                        >
                          {starting === u.id ? 'Starting...' : 'Message'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex-1 max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Find people</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Search by name or email..."
          />
          <button
            type="button"
            onClick={() => void search()}
            disabled={loading || !query.trim()}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => void search()}
            disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 py-1.5 px-3 border border-blue-600 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            Search
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Searching...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {results.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-700">Results</h2>
            <ul className="space-y-1 divide-y divide-slate-100">
              {results.map((u) => (
                <li key={u.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {u.displayName}
                      </p>
                      {u.about && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">{u.about}</p>
                      )}
                    </div>
                  </div>
                  {u.id !== user.id && (
                    <button
                      type="button"
                      onClick={() => void startConversation(u.id)}
                      disabled={starting === u.id}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      {starting === u.id ? 'Starting...' : 'Message'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
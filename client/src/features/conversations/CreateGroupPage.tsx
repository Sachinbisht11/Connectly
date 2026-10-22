import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createGroupConversation } from './api';

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{ id: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=20`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as { users: Array<{ id: string; displayName: string }> };
      setResults(data.users.filter((u) => u.id !== user?.id));
    } catch {
      setError('Unable to search users. Please try again.');
    }
  };

  const toggleUser = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isSelected = (id: string) => selected.has(id);

  const onCreate = async () => {
    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }
    if (selected.size === 0) {
      setError('Select at least one participant.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { conversation } = await createGroupConversation({
        name: name.trim(),
        description: description.trim() || undefined,
        participantIds: [user!.id, ...Array.from(selected)],
      });
      navigate(`/conversations/${conversation.id}`);
    } catch {
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => navigate('/conversations')}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-900">New group</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4 border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Group name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend plans"
            className="w-full py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a group description..."
            rows={2}
            className="w-full py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Participants
            </label>
            <span className="text-xs text-slate-500">
              {selected.size} selected
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                void searchUsers();
              }}
              placeholder="Search people to add..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => void searchUsers()}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {loading && <p className="text-sm text-slate-500">Searching...</p>}

          <ul className="space-y-1 max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2">
            {results.length === 0 && !loading && (
              <p className="text-sm text-slate-500 text-center py-2">
                No results
              </p>
            )}
            {results.map((u) => (
              <li
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-900">{u.displayName}</span>
                </div>
                {isSelected(u.id) ? (
                  <span className="text-sm font-medium text-blue-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Added
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUser(u.id);
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-500 px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    Add
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => void onCreate()}
          disabled={loading || !name.trim() || selected.size === 0}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create group
        </button>
      </div>
    </div>
  );
}
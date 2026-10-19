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
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => navigate('/conversations')}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">New group</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend plans"
            className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a group description..."
            rows={2}
            className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Participants
            </label>
            <span className="text-xs text-gray-500">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="button"
              onClick={() => void searchUsers()}
              className="absolute left-2 top-1/2 -mt-2 text-gray-400"
            >
              🔍
            </button>
          </div>

          {loading && <p className="text-sm text-gray-500">Searching...</p>}

          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {results.length === 0 && !loading && (
              <p className="text-sm text-gray-500 text-center py-2">
                No results
              </p>
            )}
            {results.map((u) => (
              <li
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-900">{u.displayName}</span>
                </div>
                {isSelected(u.id) ? (
                  <span className="text-blue-600 font-medium">Added</span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUser(u.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-500"
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
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create group
        </button>
      </div>
    </div>
  );
}

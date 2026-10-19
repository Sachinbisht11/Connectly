import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  fetchGroupMembers,
  removeGroupMember,
  changeGroupMemberRole,
  updateGroupConversation,
  fetchConversations,
  type Conversation,
  type GroupMember,
  type UpdateGroupInput,
} from './api';

export default function GroupInfoPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGroup = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError('');
    try {
      // The conversation may come through route state (navigated from the list).
      const stateConv = (location.state as { conversation?: Conversation })?.conversation;
      if (stateConv && stateConv.id === conversationId) {
        setConversation(stateConv);
      } else {
        // Fall back to looking it up in the conversations list (direct URL).
        const data = await fetchConversations();
        const found = data.find((c: Conversation) => c.id === conversationId);
        setConversation(found || null);
      }

      const memberData = await fetchGroupMembers(conversationId);
      setMembers(memberData);

      if (stateConv?.groupName) setGroupName(stateConv.groupName);
      if (stateConv?.groupDescription) setGroupDescription(stateConv.groupDescription);
    } catch {
      setError('Unable to load group info. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, location.state]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const isAdmin = () => {
    if (!user || !conversation) return false;
    const me = members.find((m) => m.userId === user.id);
    return me?.role === 'admin';
  };

  const onSave = async () => {
    if (!conversationId) return;
    setSaving(true);
    setError('');
    try {
      const input: UpdateGroupInput = {};
      if (groupName.trim()) input.name = groupName.trim();
      input.description = groupDescription.trim() || undefined;
      input.avatar = null;
      await updateGroupConversation(conversationId, input);
      setConversation((prev) => (prev ? { ...prev, groupName: groupName.trim(), groupDescription: groupDescription.trim() || null } : prev));
      setEditMode(false);
    } catch {
      setError('Failed to update group info. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onRemoveMember = async (userId: string) => {
    if (!conversationId) return;
    setError('');
    try {
      await removeGroupMember(conversationId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch {
      setError('Failed to remove member. You may need to be an admin.');
    }
  };

  const onChangeRole = async (userId: string, role: 'admin' | 'member') => {
    if (!conversationId) return;
    setError('');
    try {
      await changeGroupMemberRole(conversationId, userId, { role });
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m))
      );
    } catch {
      setError('Failed to change role. You may need to be an admin.');
    }
  };

  if (loading) return null;
  if (!conversation) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 text-center">
        <p className="text-gray-500">Group not found.</p>
        <button
          type="button"
          onClick={() => navigate('/conversations')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-500"
        >
          Back to messages
        </button>
      </div>
    );
  }

  const isGroup = conversation.type === 'group';
  const displayName = conversation.groupName || `Conversation ${conversation.id.slice(-6)}`;

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => navigate(`/conversations/${conversationId}`)}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {isGroup ? 'Group info' : 'Conversation info'}
        </h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">{displayName}</h2>
            {conversation.groupDescription && (
              <p className="text-sm text-gray-500">{conversation.groupDescription}</p>
            )}
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              {isGroup ? 'Group' : 'Direct'}
            </span>
          </div>
        </div>

        {isGroup && (
          <>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Group settings
              </h3>
              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      rows={2}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onSave()}
                      disabled={saving}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setGroupName(conversation.groupName || '');
                    setGroupDescription(conversation.groupDescription || '');
                    setEditMode(true);
                  }}
                  disabled={!isAdmin()}
                  className="text-xs text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  Edit group info
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Members ({members.length})
        </h3>
        <ul className="space-y-2">
          {members.map((m) => {
            const me = m.userId === user?.id;
            const memberAdmin = m.role === 'admin';
            return (
              <li key={m.userId} className="flex items-center justify-between p-2 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                    {m.userId.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{m.userId.slice(-6)}</p>
                    {me && <span className="text-xs text-blue-600">You</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      memberAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {memberAdmin ? 'Admin' : 'Member'}
                  </span>
                  {isAdmin() && !me && memberAdmin && (
                    <button
                      type="button"
                      onClick={() => void onChangeRole(m.userId, 'member')}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Demote
                    </button>
                  )}
                  {isAdmin() && !me && !memberAdmin && (
                    <button
                      type="button"
                      onClick={() => void onChangeRole(m.userId, 'admin')}
                      className="text-xs text-blue-600 hover:text-blue-500"
                    >
                      Promote
                    </button>
                  )}
                  {(isAdmin() && !me) ? (
                    <button
                      type="button"
                      onClick={() => void onRemoveMember(m.userId)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {isGroup && isAdmin() && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Add member
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="User ID"
                className="flex-1 py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                disabled={true}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-500"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Member search coming soon — add members by user ID for now.
            </p>
          </div>
        )}
      </div>

      {isGroup && isAdmin() && members.filter((m) => m.role === 'admin').length <= 1 && (
        <div className="mt-3 p-3 rounded-md bg-amber-50 text-sm text-amber-700">
          You are the last admin. Promote another member before leaving or demoting yourself.
        </div>
      )}
    </div>
  );
}

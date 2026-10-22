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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-slate-500">Group not found.</p>
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
    <div className="flex-1 max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => navigate(`/conversations/${conversationId}`)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {isGroup ? 'Group info' : 'Conversation info'}
        </h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4 border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-medium text-slate-600">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{displayName}</h2>
            {conversation.groupDescription && (
              <p className="text-sm text-slate-500 mt-0.5">{conversation.groupDescription}</p>
            )}
            <span className="text-xs text-slate-400 uppercase tracking-wider mt-1 inline-block">
              {isGroup ? 'Group' : 'Direct'}
            </span>
          </div>
        </div>

        {isGroup && (
          <>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Group settings
              </h3>
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Group name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      rows={2}
                      className="w-full py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => void onSave()}
                      disabled={saving}
                      className="flex-1 py-2.5 px-4 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  Edit group info
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Members ({members.length})
        </h3>
        <ul className="space-y-2">
          {members.map((m) => {
            const me = m.userId === user?.id;
            const memberAdmin = m.role === 'admin';
            const displayName = m.displayName || `User ${m.userId.slice(-6)}`;
            const avatar = m.avatar || null;
            return (
              <li key={m.userId} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600 overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{displayName}</p>
                    {me && <span className="text-xs text-blue-600 font-medium">You</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      memberAdmin ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {memberAdmin ? 'Admin' : 'Member'}
                  </span>
                  {isAdmin() && !me && memberAdmin && (
                    <button
                      type="button"
                      onClick={() => void onChangeRole(m.userId, 'member')}
                      className="text-xs text-slate-600 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                    >
                      Demote
                    </button>
                  )}
                  {isAdmin() && !me && !memberAdmin && (
                    <button
                      type="button"
                      onClick={() => void onChangeRole(m.userId, 'admin')}
                      className="text-xs text-blue-600 hover:text-blue-500 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Promote
                    </button>
                  )}
                  {(isAdmin() && !me) ? (
                    <button
                      type="button"
                      onClick={() => void onRemoveMember(m.userId)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
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
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Add member
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="User ID"
                className="flex-1 py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                disabled={true}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-500"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Member search coming soon — add members by user ID for now.
            </p>
          </div>
        )}
      </div>

      {isGroup && isAdmin() && members.filter((m) => m.role === 'admin').length <= 1 && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 text-sm text-amber-700 border border-amber-100">
          You are the last admin. Promote another member before leaving or demoting yourself.
        </div>
      )}
    </div>
  );
}
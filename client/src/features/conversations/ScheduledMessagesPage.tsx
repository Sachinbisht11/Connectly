import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  fetchScheduledMessages,
  cancelScheduledMessage,
  fetchScheduledMessageCounts,
  type ScheduledMessage,
  type ScheduledMessageStatus,
} from './api';

export default function ScheduledMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState<Record<ScheduledMessageStatus, number>>({
    scheduled: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  });
  const [activeTab, setActiveTab] = useState<ScheduledMessageStatus>('scheduled');
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const loadMessages = useCallback(async (reset = false) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchScheduledMessages({
        status: activeTab,
        limit: 20,
        cursor: reset ? undefined : cursor,
      });
      if (reset) {
        setMessages(data.messages);
      } else {
        setMessages((prev) => [...prev, ...data.messages]);
      }
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      setError('Unable to load scheduled messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, cursor]);

  const loadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchScheduledMessageCounts();
      setCounts(data);
    } catch {
      // Ignore count errors
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      void loadMessages(true);
      void loadCounts();
    }
  }, [authLoading, user, loadMessages, loadCounts]);

  useEffect(() => {
    if (user) {
      void loadMessages(true);
      void loadCounts();
    }
  }, [activeTab, user]);

  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs <= 0) return 'Due now';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    return `in ${diffDays}d`;
  };

  const getStatusBadgeClass = (status: ScheduledMessageStatus): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700';
      case 'processing':
        return 'bg-amber-50 text-amber-700';
      case 'sent':
        return 'bg-green-50 text-green-700';
      case 'failed':
        return 'bg-red-50 text-red-700';
      case 'cancelled':
        return 'bg-slate-50 text-slate-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const handleCancel = async (scheduledMessageId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled message?')) return;
    setError('');
    try {
      await cancelScheduledMessage(scheduledMessageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === scheduledMessageId ? { ...m, status: 'cancelled' as ScheduledMessageStatus } : m))
      );
      void loadCounts();
    } catch {
      setError('Failed to cancel scheduled message. Please try again.');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs: { key: ScheduledMessageStatus; label: string; count: number }[] = [
    { key: 'scheduled', label: 'Pending', count: counts.scheduled },
    { key: 'sent', label: 'Sent', count: counts.sent },
    { key: 'failed', label: 'Failed', count: counts.failed },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <div className="flex-1 max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Scheduled Messages</h1>
        <span className="text-sm text-slate-500">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4 border border-red-100">
          {error}
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <svg
              className="w-12 h-12 text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">No scheduled messages</h2>
            <p className="text-slate-500 max-w-xs">
              {activeTab === 'scheduled'
                ? 'Schedule a message from any conversation to see it here.'
                : `No ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase()} messages yet.`}
            </p>
          </div>
        )}

        <ul className="divide-y divide-slate-100">
          {messages.map((msg) => (
            <li key={msg.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadgeClass(msg.status)}`}
                    >
                      {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                    </span>
                    {msg.status === 'scheduled' && (
                      <span className="text-xs text-slate-500">
                        {formatRelativeTime(msg.scheduledAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-900 truncate mb-1">{msg.content}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Scheduled: {formatDateTime(msg.scheduledAt)}</span>
                    {msg.claimedAt && <span>Claimed: {formatDateTime(msg.claimedAt)}</span>}
                    {msg.sentMessageId && <span>Sent: {formatDateTime(msg.updatedAt)}</span>}
                    {msg.attemptCount > 1 && (
                      <span className="text-amber-600">Attempt #{msg.attemptCount}</span>
                    )}
                  </div>
                  {msg.lastError && (
                    <p className="text-xs text-red-600 mt-1 font-medium">Error: {msg.lastError}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {msg.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(msg.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {hasMore && !loading && (
          <div className="p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => void loadMessages(false)}
              className="w-full py-2 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
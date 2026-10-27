import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ChangeEvent,
  FormEvent,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  fetchScheduledMessages,
  createScheduledMessage,
  fetchScheduledMessage,
  updateScheduledMessage,
  cancelScheduledMessage,
  fetchConversations,
  type ScheduledMessage,
  type ScheduledMessageStatus,
} from './api';
import { Button } from '../../components/ui/Button';
import {
  ClockIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperclipIcon,
  GlobeIcon,
} from '../../components/ui/Icons';

/* ───────────────────────── Status mapping ───────────────────────── */

type UIStatus = 'all' | 'pending' | 'delivered' | 'failed' | 'cancelled';

const UI_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

function backendStatusToUI(status: ScheduledMessageStatus): UIStatus {
  switch (status) {
    case 'scheduled':
    case 'processing':
      return 'pending';
    case 'sent':
      return 'delivered';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
  }
}

function uiStatusToBackend(ui: UIStatus): ScheduledMessageStatus | undefined {
  switch (ui) {
    case 'pending':
      return 'scheduled'; // list by the primary pending status
    case 'delivered':
      return 'sent';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    case 'all':
      return undefined;
  }
}

function uiStatusColor(ui: UIStatus): string {
  switch (ui) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'delivered':
      return 'bg-green-50 text-green-700 border-green-100';
    case 'failed':
      return 'bg-red-50 text-red-700 border-red-100';
    case 'cancelled':
    case 'all':
      return 'bg-slate-50 text-slate-600 border-slate-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
}

/* ───────────────────────── Time helpers ───────────────────────── */

function localTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function utcOffsetString(): string {
  const offset = -new Date().getTimezoneOffset(); // minutes, east of UTC is positive
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatLocal(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatUtc(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function isPast(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  const axiosError = err as {
    response?: {
      data?: {
        error?: {
          message?: unknown;
        };
      };
    };
  } | undefined;
  const message = axiosError?.response?.data?.error?.message;
  if (typeof message === 'string') return message;
  return fallback;
}

/* ───────────────────────── Recipient resolution ───────────────────────── */

interface ConversationSummary {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar?: string | null;
}

function buildConversationSummaries(
  conversations: Awaited<ReturnType<typeof fetchConversations>>
): Map<string, ConversationSummary> {
  const map = new Map<string, ConversationSummary>();
  for (const c of conversations) {
    let name = '';
    let avatar: string | null | undefined = undefined;
    if (c.type === 'group') {
      name = c.groupName || 'Group';
      avatar = c.groupAvatar || undefined;
    } else {
      name = c.otherParticipantName || `User ${c.id.slice(-6)}`;
      avatar = c.otherParticipantAvatar || undefined;
    }
    map.set(c.id, { id: c.id, type: c.type, name, avatar });
  }
  return map;
}

/* ───────────────────────── Component ───────────────────────── */

export default function ScheduledMessagesPage() {
  const { user, loading: authLoading } = useAuth();

  const [pages, setPages] = useState<Array<{
    messages: ScheduledMessage[];
    nextCursor?: string;
    hasMore: boolean;
  }>>([]);
  const [pageIndex, setPageIndex] = useState(0);
  // Refs track the current page/cursor so fetchPage doesn't need pages/pageIndex
  // as dependencies (which caused an infinite re-render loop: fetching updated
  // pages/pageIndex, which recreated fetchPage, which re-ran the effect).
  const pagesRef = useRef(pages);
  const pageIndexRef = useRef(pageIndex);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<UIStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Map<string, ConversationSummary>>(
    new Map()
  );

  /* Modals */
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ conversationId: string; content: string; scheduledAt: string }>({
    conversationId: '',
    content: '',
    scheduledAt: '',
  });
  const [creatingDraft, setCreatingDraft] = useState<{
    conversationId: string;
    content: string;
    scheduledAt: string;
  }>({ conversationId: '', content: '', scheduledAt: '' });

  /* Action states */
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState<Set<string>>(new Set());
  const [successToast, setSuccessToast] = useState<{ message: string; timeout?: number } | null>(null);

  const conversationList = useMemo(
    () => Array.from(conversations.values()),
    [conversations]
  );

  const timezoneName = useMemo(localTimezoneName, []);
  const utcOffset = useMemo(utcOffsetString, []);

  /* ───────── Data loading ───────── */

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchConversations();
      setConversations(buildConversationSummaries(data));
    } catch {
      // Conversations are only needed for recipient labels / selection; non-fatal.
    }
  }, [user]);

  const fetchPage = useCallback(
    async (reset: boolean) => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const status = filter === 'all' ? undefined : uiStatusToBackend(filter);
        const cursor = reset ? undefined : pagesRef.current[pageIndexRef.current]?.nextCursor;
        const data = await fetchScheduledMessages({
          status,
          limit: 20,
          cursor,
        });
        if (reset) {
          setPages([data]);
          setPageIndex(0);
          pagesRef.current = [data];
          pageIndexRef.current = 0;
        } else {
          setPages((prev) => {
            const next = [...prev];
            next[pageIndexRef.current + 1] = data;
            return next;
          });
          setPageIndex((i) => i + 1);
          pagesRef.current = [...pagesRef.current, data];
          pageIndexRef.current += 1;
        }
      } catch (err) {
        const msg = getErrorMessage(err, 'Unable to load scheduled messages.');
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [user, filter]
  );

  useEffect(() => {
    if (!authLoading && user) {
      void loadConversations();
      void fetchPage(true);
    }
  }, [authLoading, user, loadConversations, fetchPage]);

  useEffect(() => {
    if (user && filter !== 'all') {
      void fetchPage(true);
    }
  }, [filter, user, fetchPage]);

  /* ───────── Derived data ───────── */

  const currentPage = pages[pageIndex];
  const hasMore = currentPage ? currentPage.hasMore : false;
  const isFirstPage = pageIndex === 0;
  const isLastPage = !hasMore;

  const loadLastPage = useCallback(async () => {
    if (!user || loading || isLastPage) return;
    // Cursor pagination only supports forward movement, so walk forward through
    // remaining pages until there are no more.
    setLoading(true);
    setError('');
    try {
      while (true) {
        const last = pagesRef.current[pagesRef.current.length - 1];
        if (!last || !last.hasMore || !last.nextCursor) break;
        const data = await fetchScheduledMessages({
          status: filter === 'all' ? undefined : uiStatusToBackend(filter),
          limit: 20,
          cursor: last.nextCursor,
        });
        setPages((prev) => [...prev, data]);
        pagesRef.current = [...pagesRef.current, data];
        if (!data.hasMore) break;
      }
      setPageIndex(pagesRef.current.length - 1);
      pageIndexRef.current = pagesRef.current.length - 1;
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load scheduled messages.'));
    } finally {
      setLoading(false);
    }
  }, [user, filter, loading, isLastPage]);

  const filteredMessages = useMemo(() => {
    const currentPage = pages[pageIndex];
    const pageMessages = currentPage ? currentPage.messages : [];
    const q = searchQuery.toLowerCase();
    return pageMessages.filter((m) => {
      const conv = conversations.get(m.conversationId);
      const name = conv?.name.toLowerCase() || '';
      const content = m.content.toLowerCase();
      const matchesSearch =
        !q || name.includes(q) || content.includes(q);
      const matchesFilter =
        filter === 'all' || backendStatusToUI(m.status) === filter;
      return matchesSearch && matchesFilter;
    });
  }, [pages, pageIndex, conversations, filter, searchQuery]);

  const allMessages = useMemo(
    () => pages.flatMap((p) => p.messages),
    [pages]
  );

  const filterCounts: Record<UIStatus, number> = useMemo(() => {
    const result: Record<UIStatus, number> = {
      all: allMessages.length,
      pending: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const m of allMessages) {
      const ui = backendStatusToUI(m.status);
      if (ui !== 'all') result[ui] += 1;
    }
    return result;
  }, [allMessages]);

  /* ───────── Actions ───────── */

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this scheduled message?')) return;
    setCancelling((prev) => new Set([...prev, id]));
    setError('');
    try {
      await cancelScheduledMessage(id);
      setSuccessToast({ message: 'Scheduled message cancelled.' });
      await fetchPage(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to cancel scheduled message.'));
    } finally {
      setCancelling((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const openEdit = async (id: string) => {
    setError('');
    try {
      const msg = await fetchScheduledMessage(id);
      setEditDraft({
        conversationId: msg.conversationId,
        content: msg.content,
        scheduledAt: new Date(msg.scheduledAt).toISOString().slice(0, 16),
      });
      setEditingId(id);
      setEditOpen(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load message details.'));
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError('');
    setSaving(true);
    try {
      await updateScheduledMessage(editingId, {
        content: editDraft.content.trim(),
        scheduledAt: editDraft.scheduledAt,
      });
      setSuccessToast({ message: 'Scheduled message updated.' });
      setEditOpen(false);
      setEditingId(null);
      await fetchPage(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update scheduled message.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await createScheduledMessage({
        conversationId: creatingDraft.conversationId,
        content: creatingDraft.content.trim(),
        scheduledAt: creatingDraft.scheduledAt,
      });
      setSuccessToast({ message: 'Message scheduled.' });
      setCreateOpen(false);
      setCreatingDraft({ conversationId: '', content: '', scheduledAt: '' });
      await fetchPage(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to schedule message.'));
    } finally {
      setCreating(false);
    }
  };

  const dismissToast = () => setSuccessToast(null);

  /* ───────── Render ───────── */

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filterItems: { key: UIStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'failed', label: 'Failed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const isEditing = editOpen && editingId != null;
  const editingMessage = isEditing
    ? allMessages.find((m) => m.id === editingId)
    : undefined;

  return (
    <div className="flex-1 min-w-0 bg-[#f5f5f7] text-slate-900">
      {/* Header */}
      <header className="px-6 pb-6 pt-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scheduled Messages</h1>
            <p className="text-slate-500 text-sm">
              Manage and monitor messages scheduled for future automated delivery.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="mr-2" />
            {creating ? 'Scheduling...' : 'Schedule New Message'}
          </Button>
        </div>

        {/* Timezone badge */}
        <div className="flex items-center gap-2">
          <GlobeIcon className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500">
            {timezoneName} - {utcOffset}
          </span>
        </div>
      </header>

      {/* Toolbar: search + filters */}
      <div className="px-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search recipients, groups, or content..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              aria-label="Search scheduled messages"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1 bg-white rounded-lg p-1 border border-slate-200 overflow-x-auto">
            {filterItems.map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {active && filterCounts[item.key] > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                      {filterCounts[item.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Success toast */}
      {successToast && (
        <div className="px-6 mb-4">
          <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-sm text-green-700 flex items-center justify-between">
            <span>{successToast.message}</span>
            <button
              type="button"
              onClick={dismissToast}
              className="ml-2 text-green-600 hover:text-green-800"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="px-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading && filteredMessages.length === 0 ? (
            <div className="p-8">
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 text-slate-300 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                {searchQuery ? 'No matching messages' : 'No scheduled messages'}
              </h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
                {searchQuery
                  ? 'Try adjusting your search or filters.'
                  : 'Schedule a message from any conversation to see it here.'}
              </p>
              <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="mr-2" />
                Schedule New Message
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Content preview</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery time</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMessages.map((msg) => {
                    const conv = conversations.get(msg.conversationId);
                    const recipient = conv
                      ? {
                          name: conv.name,
                          type: conv.type,
                          avatar: conv.avatar,
                        }
                      : { name: 'Unknown recipient', type: 'direct' as const, avatar: undefined };
                    const isPending =
                      msg.status === 'scheduled' || msg.status === 'processing';
                    const hasAttachment = false; // backend scheduled-message model has no media field
                    return (
                      <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              {recipient.avatar ? (
                                <img
                                  src={recipient.avatar}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                                  {recipient.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {recipient.type === 'group' && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {recipient.name}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {recipient.type === 'group' ? 'Group' : 'Direct message'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-900 truncate block max-w-md">
                              {msg.content}
                            </span>
                            {hasAttachment && (
                              <span className="flex-shrink-0 text-slate-400" title="Attachment">
                                <PaperclipIcon className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                          {msg.lastError && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              Error: {msg.lastError}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">
                            {formatLocal(msg.scheduledAt)}
                          </p>
                          <p className="text-xs text-slate-500">UTC {formatUtc(msg.scheduledAt)}</p>
                          {isPast(msg.scheduledAt) && msg.status === 'scheduled' && (
                            <p className="text-xs text-amber-600 mt-0.5 font-medium">Due</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${uiStatusColor(backendStatusToUI(msg.status))}`}>
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: 'currentColor' }}
                            ></span>
                            {UI_STATUS_LABELS[backendStatusToUI(msg.status)] || msg.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && !cancelling.has(msg.id) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void openEdit(msg.id)}
                                  disabled={saving}
                                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  aria-label="Edit scheduled message"
                                  title="Edit"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleCancel(msg.id)}
                                  disabled={cancelling.has(msg.id)}
                                  className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  aria-label="Cancel scheduled message"
                                  title="Cancel"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {/* {!isPending && (
                              <button
                                type="button"
                                onClick={() => void openEdit(msg.id)}
                                disabled={saving}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="View details"
                                title="View details"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                            )} */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Showing {filteredMessages.length} message
                  {filteredMessages.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPageIndex(0)}
                    disabled={isFirstPage || loading}
                    className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="First page"
                  >
                    <ChevronLeftIcon className="w-4 h-4" /> First
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageIndex((i) => Math.max(i - 1, 0))}
                    disabled={isFirstPage || loading}
                    className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeftIcon className="w-3 h-3" /> Prev
                  </button>
                  <span className="px-3 py-1.5 rounded-md text-sm text-slate-700 font-medium bg-white border border-slate-200">
                    Page {pageIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (loading || isLastPage) return;
                      void fetchPage(false);
                    }}
                    disabled={isLastPage || loading}
                    className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    Next <ChevronRightIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (loading || isLastPage) return;
                      void loadLastPage();
                    }}
                    disabled={isLastPage || loading}
                    className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Last page"
                  >
                    Last <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Schedule new message</h2>
            <p className="text-sm text-slate-500 mb-6">
              Choose a conversation, write your message, and pick when it should be delivered.
            </p>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Conversation
                </label>
                <select
                  value={creatingDraft.conversationId}
                  onChange={(e) =>
                    setCreatingDraft((d) => ({ ...d, conversationId: e.target.value }))
                  }
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={creating}
                >
                  <option value="">Select a conversation</option>
                  {conversationList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === 'group' ? 'Group' : 'Direct'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  value={creatingDraft.content}
                  onChange={(e) =>
                    setCreatingDraft((d) => ({ ...d, content: e.target.value }))
                  }
                  rows={3}
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Delivery date & time
                </label>
                <input
                  type="datetime-local"
                  value={creatingDraft.scheduledAt}
                  onChange={(e) =>
                    setCreatingDraft((d) => ({ ...d, scheduledAt: e.target.value }))
                  }
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !creatingDraft.conversationId || !creatingDraft.content.trim() || !creatingDraft.scheduledAt}>
                  {creating ? 'Scheduling...' : 'Schedule message'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {editingMessage ? 'Edit scheduled message' : 'Loading…'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Update the message content or delivery time. Changes apply to the scheduled delivery.
            </p>
            <form onSubmit={(e) => void handleSaveEdit(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Conversation
                </label>
                <select
                  value={editDraft.conversationId}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, conversationId: e.target.value }))
                  }
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={saving || !editingMessage}
                >
                  {conversationList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === 'group' ? 'Group' : 'Direct'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Recipient: {editingMessage
                    ? (conversations.get(editingMessage.conversationId)?.name ||
                        editingMessage.conversationId.slice(-6))
                    : ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  value={editDraft.content}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, content: e.target.value }))
                  }
                  rows={3}
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={saving || !editingMessage}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Delivery date & time
                </label>
                <input
                  type="datetime-local"
                  value={editDraft.scheduledAt}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, scheduledAt: e.target.value }))
                  }
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={saving || !editingMessage}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingId(null);
                  }}
                  disabled={saving}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !editingMessage || !editDraft.content.trim() || !editDraft.scheduledAt}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

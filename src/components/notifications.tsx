import { useCallback, useEffect, useState } from 'react'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from '../api/notifications.api'
import { useLanguage } from '../i18n'

// ============================================================
// HOOK — loads list + unread count, mark read / mark all
// ============================================================

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [listRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ])

      setItems(listRes.data ?? [])
      setUnreadCount(countRes.data?.count ?? 0)
    } catch (err: any) {
      console.error('Failed to load notifications:', err)

      setError(
        err.response?.data?.message ||
          'Failed to load notifications.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const markRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      setItems(prev =>
        prev.map(n =>
          n.notificationId === notificationId
            ? { ...n, isRead: true }
            : n
        )
      )
      setUnreadCount(c => Math.max(0, c - 1))

      try {
        await markNotificationAsRead(notificationId)
      } catch (err) {
        console.error(
          'Failed to mark notification as read:',
          err
        )

        // Re-sync with the server on failure
        refresh()
      }
    },
    [refresh]
  )

  const markAll = useCallback(async () => {
    // Optimistic update
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      await markAllNotificationsAsRead()
    } catch (err) {
      console.error(
        'Failed to mark all notifications as read:',
        err
      )

      refresh()
    }
  }, [refresh])

  return {
    items,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAll,
  }
}

// ============================================================
// HELPERS
// ============================================================

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`

  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`

  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`

  return new Date(iso).toLocaleDateString()
}

function typeIcon(notificationType: string): string {
  switch (notificationType) {
    case 'CASE_ASSIGNED':
      return '📥'
    case 'CASE_RETURNED':
      return '↩️'
    case 'CASE_TRANSFERRED':
      return '🔄'
    case 'CASE_ARCHIVED':
      return '🗃️'
    case 'CASE_APPROVED':
      return '✅'
    case 'CASE_REJECTED':
      return '❌'
    default:
      return '🔔'
  }
}

// ============================================================
// TOPBAR BELL — icon + unread badge + recent dropdown
// ============================================================

export function NotificationBell({
  onOpenPage,
}: {
  onOpenPage?: () => void
}) {
  const { t } = useLanguage()
  const {
    items,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAll,
  } = useNotifications()

  const [open, setOpen] = useState(false)

  // Initial load + poll for new notifications every 60s
  useEffect(() => {
    refresh()

    const interval = setInterval(refresh, 60000)

    return () => clearInterval(interval)
  }, [refresh])

  const recent = items.slice(0, 8)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
      >
        <span className="text-base">🔔</span>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p
              className="text-sm font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('notifications')}

              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-semibold text-red-500">
                  {unreadCount} {t('notif_unread')}
                </span>
              )}
            </p>

            {unreadCount > 0 && (
              <button
                onClick={markAll}
                className="text-xs text-[#1E4B8F] hover:underline font-medium"
              >
                {t('notif_markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">
                …
              </p>
            )}

            {!loading && error && (
              <p className="px-4 py-6 text-xs text-red-500 text-center">
                {error}
              </p>
            )}

            {!loading && !error && recent.length === 0 && (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">
                {t('notif_empty')}
              </p>
            )}

            {recent.map(n => (
              <button
                key={n.notificationId}
                onClick={() => {
                  if (!n.isRead) markRead(n.notificationId)
                }}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-2.5 ${
                  n.isRead ? 'opacity-60' : ''
                }`}
              >
                <span className="text-sm flex-shrink-0 mt-0.5">
                  {typeIcon(n.notificationType)}
                </span>

                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-gray-800 truncate">
                    {n.title}
                  </span>

                  <span className="block text-xs text-gray-600 leading-relaxed">
                    {n.message}
                  </span>

                  <span className="block text-xs text-gray-400 mt-1">
                    {n.createdAt
                      ? timeAgo(n.createdAt)
                      : ''}
                  </span>
                </span>

                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-[#1E4B8F] flex-shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>

          {onOpenPage && (
            <button
              onClick={() => {
                setOpen(false)
                onOpenPage()
              }}
              className="w-full py-2.5 text-xs font-semibold text-[#1E4B8F] hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              {t('notifications')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// FULL NOTIFICATIONS PAGE — shared by all portals
// ============================================================

export function NotificationsPageView({
  onOpenCase,
}: {
  onOpenCase?: (caseId: string) => void
}) {
  const { t } = useLanguage()
  const {
    items,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAll,
  } = useNotifications()

  useEffect(() => {
    refresh()
  }, [refresh])

  function handleClick(n: NotificationItem) {
    if (!n.isRead) markRead(n.notificationId)

    if (n.caseId && onOpenCase) {
      onOpenCase(n.caseId)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('notifications')}
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} ${t('notif_unread')}`
              : t('notif_emptySub')}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAll}
            className="px-3 py-2 text-xs font-semibold text-[#1E4B8F] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('notif_markAllRead')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading && items.length === 0 && (
          <p className="px-5 py-10 text-sm text-gray-400 text-center">
            …
          </p>
        )}

        {!loading && error && (
          <p className="px-5 py-10 text-sm text-red-500 text-center">
            {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="px-5 py-16 text-center">
            <div className="text-5xl mb-3 opacity-40">
              🔔
            </div>

            <p className="text-gray-500 font-semibold">
              {t('notif_empty')}
            </p>

            <p className="text-gray-400 text-sm mt-1">
              {t('notif_emptySub')}
            </p>
          </div>
        )}

        {items.map(n => (
          <div
            key={n.notificationId}
            className={`px-5 py-4 border-b border-gray-50 last:border-b-0 flex gap-3 items-start ${
              n.isRead ? 'opacity-70' : 'bg-blue-50/40'
            }`}
          >
            <span className="text-base flex-shrink-0 mt-0.5">
              {typeIcon(n.notificationType)}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-gray-900">
                  {n.title}
                </p>

                {!n.isRead && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-[#1E4B8F] text-white px-1.5 py-0.5 rounded">
                    New
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mt-0.5">
                {n.message}
              </p>

              <p className="text-xs text-gray-400 mt-1.5">
                {n.createdAt
                  ? new Date(n.createdAt).toLocaleString()
                  : ''}
              </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              {!n.isRead && (
                <button
                  onClick={() => markRead(n.notificationId)}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  ✓
                </button>
              )}

              {n.caseId && onOpenCase && (
                <button
                  onClick={() => handleClick(n)}
                  className="text-xs font-semibold text-[#1E4B8F] border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('notif_viewCase')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

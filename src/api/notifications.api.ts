import apiClient from './client'

export interface NotificationCase {
  caseId: string
  trackingNumber: string
  status: string
}

export interface NotificationItem {
  notificationId: string
  userId: string
  caseId: string | null
  notificationType: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  readAt: string | null
  case: NotificationCase | null
}

export interface GetNotificationsResponse {
  success: boolean
  data: NotificationItem[]
}

export interface GetUnreadCountResponse {
  success: boolean
  data: {
    count: number
  }
}

export interface MarkReadResponse {
  success: boolean
  message: string
  data: NotificationItem
}

export interface MarkAllReadResponse {
  success: boolean
  message: string
}

// ============================================================
// GET /notifications
// Retrieve notifications belonging to the authenticated user.
// ============================================================

export async function getNotifications(): Promise<GetNotificationsResponse> {
  const response = await apiClient.get<GetNotificationsResponse>(
    '/notifications'
  )

  return response.data
}

// ============================================================
// GET /notifications/unread-count
// Unread notification count for the authenticated user.
// ============================================================

export async function getUnreadNotificationCount(): Promise<GetUnreadCountResponse> {
  const response = await apiClient.get<GetUnreadCountResponse>(
    '/notifications/unread-count'
  )

  return response.data
}

// ============================================================
// PATCH /notifications/:notificationId/read
// Mark a specific notification as read.
// ============================================================

export async function markNotificationAsRead(
  notificationId: string
): Promise<MarkReadResponse> {
  const response = await apiClient.patch<MarkReadResponse>(
    `/notifications/${notificationId}/read`
  )

  return response.data
}

// ============================================================
// PATCH /notifications/read-all
// Mark all notifications of the authenticated user as read.
// ============================================================

export async function markAllNotificationsAsRead(): Promise<MarkAllReadResponse> {
  const response = await apiClient.patch<MarkAllReadResponse>(
    '/notifications/read-all'
  )

  return response.data
}
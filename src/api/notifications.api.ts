import apiClient from './client'

export interface NotificationItem {
  notificationId: string
  title?: string
  message?: string
  isRead?: boolean
  createdAt?: string
  [key: string]: unknown
}

export async function getNotifications() {
  const response = await apiClient.get('/notifications')
  return response.data
}

export async function getUnreadNotificationCount() {
  const response = await apiClient.get('/notifications/unread-count')
  return response.data
}

export async function markNotificationAsRead(
  notificationId: string
) {
  const response = await apiClient.patch(
    `/notifications/${notificationId}/read`
  )
  return response.data
}

export async function markAllNotificationsAsRead() {
  const response = await apiClient.patch('/notifications/read-all')
  return response.data
}
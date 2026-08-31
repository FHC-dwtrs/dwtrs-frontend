import apiClient from './client'

export interface AuditUser {
  userId: string
  name: string
  email: string
}

export interface AuditCase {
  // Add fields here later if your backend returns case details
  [key: string]: unknown
}

export interface AuditLog {
    auditLogId: string
    userId: string
    caseId: string | null
    action: string
    entityType: string
    entityId: string
    oldValues: Record<string, unknown> | null
    newValues: Record<string, unknown> | null
    ipAddress: string | null
    createdAt: string
    user: {
      userId: string
      name: string
      email: string
    } //| null
    case: unknown | null
  }

export interface AuditPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetAuditLogsResponse {
  success: boolean
  data: AuditLog[]
  pagination: AuditPagination
}

// GET /audit
export async function getAuditLogs(): Promise<GetAuditLogsResponse> {
  const response = await apiClient.get('/audit')

  return response.data
}

// GET /audit/:auditLogId
export async function getAuditLog(
  auditLogId: string
): Promise<{
  success: boolean
  data: AuditLog
}> {
  const response = await apiClient.get(
    `/audit/${auditLogId}`
  )

  return response.data
}
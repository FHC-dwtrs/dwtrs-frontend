import apiClient from './client'

export interface AuditUser {
  userId: string
  name: string
  email: string
}

export interface AuditCase {
  caseId: string
  trackingNumber: string
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
  user: AuditUser
  case: AuditCase | null
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
// Swagger documents no query params, but the pagination object
// in the response (limit: 20 by default) suggests page/limit
// are accepted even if undocumented. Both are optional so any
// existing call with no args behaves exactly as before.
export async function getAuditLogs(
  page?: number,
  limit?: number
): Promise<GetAuditLogsResponse> {
  const response = await apiClient.get('/audit', {
    params: page || limit ? { page, limit } : undefined,
  })

  return response.data
}

// GET /audit/:auditLogId
export async function getAuditLog(
  auditLogId: string
): Promise<{
  success: boolean
  data: AuditLog
}> {
  const response = await apiClient.get(`/audit/${auditLogId}`)

  return response.data
}

// Fetches every page of audit logs and returns them combined.
// NOTE: this makes one request per page (5 requests for your
// current 84 logs / 20 per page). Fine for now, but if the log
// grows into the thousands this should move to a backend filter
// like GET /audit?action=CASE_TRANSFERRED instead of pulling
// everything client-side.
export async function getAllAuditLogs(): Promise<AuditLog[]> {
  const first = await getAuditLogs(1)
  const all = [...first.data]

  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const next = await getAuditLogs(page)
    all.push(...next.data)
  }

  return all
}
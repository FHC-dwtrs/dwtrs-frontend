import type { CaseItem } from '../api/cases.api'
import type { CaseRecord, CaseStatus } from '../types'

export function formatCaseStatus(status: string, isArchived?: boolean): CaseStatus {
  if (isArchived) return 'Archived'

  const map: Record<string, CaseStatus> = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'In Progress',
    IN_PROGRESS: 'In Progress',
    PENDING_CLARIFICATION: 'Pending Clarification',
    SENT_BACK_FOR_CORRECTION: 'Returned',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    COMPLETED: 'Approved',
    ARCHIVED: 'Archived',
  }
  return map[status] ?? 'Submitted'
}

export function mapCaseToRecord(c: CaseItem): CaseRecord {
  return {
    caseId: c.caseId,
    id: c.trackingNumber,
    subject: c.subject,
    customer: c.customer?.name ?? '',
    customerPhone: c.customer?.phone ?? '',
    customerEmail: c.customer?.email ?? '',
    customerAddress: c.customer?.address ?? '',
    sector: c.currentUnit?.name ?? 'Unassigned',
    directorate: '',
    group: '',
    status: formatCaseStatus(c.status, c.isArchived),
    rawStatus: c.status,

    isArchived: c.isArchived,
    
    priority: 'Normal',
    date: new Date(c.submittedAt).toLocaleDateString(),
    lastActivity: new Date(c.updatedAt).toLocaleDateString(),
    reference: c.incomingReferenceNo ?? '',
    currentUnitId: c.currentUnit?.unitId ?? null,
    currentUnitType: (c.currentUnit?.unitType as CaseRecord['currentUnitType']) ?? null,
    // TODO(backend): expose which unit last returned this case (e.g. `lastReturnedFromUnitId`)
    // on GET /cases and GET /cases/{caseId} so Reassign can target it directly.
    returnedFromUnitId: (c as any).lastReturnedFromUnitId ?? null,
    documents: [],
    timeline: [],
    remarks: [],
  }
}
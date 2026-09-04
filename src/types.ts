export type Role = 'admin' | 'sector' | 'directorate' | 'group' | 'records'

export type CaseStatus =
  | 'New'
  | 'Submitted'
  | 'In Progress'
  | 'Pending Clarification'
  | 'Returned'
  | 'Approved'
  | 'Rejected'
  | 'Archived'
  | 'Delayed'

export type Priority = 'High' | 'Normal' | 'Low'

export interface CaseRecord {
  id: string
  caseId?: string                    // optional — real cases have it, mock data doesn't
  subject: string
  customer: string
  customerPhone: string
  customerEmail: string
  customerAddress: string
  sector: string
  directorate: string
  group: string
  status: CaseStatus
  rawStatus?: string                 // optional
  reason?: string                    // was missing entirely — mock data uses this for rejected cases
  priority: 'High' | 'Normal' | 'Low'
  date: string
  lastActivity: string
  reference: string
  currentUnitId?: string | null      // optional
  currentUnitType?: 'SECTOR' | 'DIRECTORATE' | 'GROUP' | null   // optional
  returnedFromUnitId?: string | null // optional
  documents: any[]
  timeline: any[]
  remarks: any[]
  isArchived: boolean
}

export interface DocFile {
  name: string
  size: string
  date: string
  version: number
  type: 'main' | 'attachment'
}

export interface TimelineStep {
  stage: string
  actor: string
  status: 'done' | 'active' | 'pending'
  timestamp: string
  remark?: string
}

export interface Remark {
  author: string
  role: string
  timestamp: string
  content: string
}

export interface User {
  id: string
  name: string
  username: string
  email: string
  role: Role
  unit: string
  status: 'Active' | 'Inactive'
}

export interface OrgUnit {
  id: string
  name: string
  type: 'sector' | 'directorate' | 'group'
  parent?: string
  active: number
  pending: number
  delayed: number
}

export interface AuthUnit {
  id: string
  name: string
  unitType: string
}

export interface AuthUser {
  userId: string
  name: string
  email: string
  unit: AuthUnit | null
  role: string
  permissions: string[]
}

export interface CaseHistoryEntryBase {
  timestamp: string
  by: { userId: string; name: string; email: string }
}

export interface AssignmentEntry extends CaseHistoryEntryBase {
  type: 'ASSIGNMENT'
  assignmentId: string
  fromUnit: string | null
  toUnit: string
  remarks: string | null
  assignmentStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

export interface StatusChangeEntry extends CaseHistoryEntryBase {
  type: 'STATUS_CHANGE'
  status: string
}

export interface DecisionEntry extends CaseHistoryEntryBase {
  type: 'DECISION'
  decisionType: 'APPROVED' | 'REJECTED'
  decisionText: string | null
}

export type CaseHistoryEntry = AssignmentEntry | StatusChangeEntry | DecisionEntry

export interface CaseRemarkItem {
  remarkId: string
  remarkText: string
  createdAt: string
  by: { userId: string; name: string; email: string }
  context: string | null
}
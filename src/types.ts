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
  subject: string
  customer: string
  customerPhone: string
  customerEmail: string
  customerAddress: string
  sector: string
  directorate: string
  group: string
  status: CaseStatus
  priority: Priority
  date: string
  lastActivity: string
  reference: string
  reason?: string
  documents: DocFile[]
  timeline: TimelineStep[]
  remarks: Remark[]
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
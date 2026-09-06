
// ============================================================
// REPORT PERIOD
// ============================================================

import apiClient from "./client"

export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL'

// ============================================================
// SUMMARY REPORT
// GET /reports/summary
// ============================================================

export interface SummaryReport {
  totalCases: number
  submitted: number
  underReview: number
  inProgress: number
  pendingClarification: number
  sentBackForCorrection: number
  approved: number
  rejected: number
  completed: number
  archived: number
}

export interface GetSummaryReportResponse {
  success: boolean
  data: SummaryReport
}

export async function getSummaryReport(): Promise<GetSummaryReportResponse> {
  const response = await apiClient.get<GetSummaryReportResponse>(
    '/reports/summary'
  )

  return response.data
}

// ============================================================
// BY UNIT REPORT
// GET /reports/by-unit
// ============================================================

export interface UnitReportItem {
  unitId: string
  name: string
  unitType: string
  parentUnitId: string | null
  caseCount: number
}

export interface GetByUnitReportResponse {
  success: boolean
  data: UnitReportItem[]
}

export async function getByUnitReport(): Promise<GetByUnitReportResponse> {
  const response = await apiClient.get<GetByUnitReportResponse>(
    '/reports/by-unit'
  )

  return response.data
}

// ============================================================
// WORKFLOW REPORT
// GET /reports/workflow
// ============================================================

export interface WorkflowReportTotals {
  totalMovements: number
  assignments: number
  returns: number
  reassignments: number
  transfers: number
}

export interface WorkflowUnit {
  unitId: string
  name: string
  unitType: string
}

export interface WorkflowCase {
  trackingNumber: string
  subject: string
  status: string
}

export interface WorkflowRoute {
  fromUnitId: string
  fromUnitName: string
  toUnitId: string
  toUnitName: string
  movementCount: number
}

export interface WorkflowMovement {
  assignmentId: string
  caseId: string
  fromUnitId: string
  toUnitId: string
  assignmentStatus: string
  remarks: string | null
  assignedAt: string
  completedAt: string | null
  fromUnit: WorkflowUnit
  toUnit: WorkflowUnit
  case: WorkflowCase
}

export interface WorkflowReport {
  totals: WorkflowReportTotals
  routes: WorkflowRoute[]
  movements: WorkflowMovement[]
}

export interface GetWorkflowReportResponse {
  success: boolean
  data: WorkflowReport
}

export async function getWorkflowReport(): Promise<GetWorkflowReportResponse> {
  const response = await apiClient.get<GetWorkflowReportResponse>(
    '/reports/workflow'
  )

  return response.data
}

// ============================================================
// PENDING REPORT
// GET /reports/pending
// ============================================================

export interface PendingReportCustomer {
  customerId: string
  name: string
}

export interface PendingReportUnit {
  unitId: string
  name: string
  unitType: string
}

export interface PendingReportItem {
  caseId: string
  trackingNumber: string
  subject: string
  status: string
  customer: PendingReportCustomer
  currentUnit: PendingReportUnit
  submittedAt: string
  lastUpdatedAt: string
  waitingDays: number
}

export interface GetPendingReportResponse {
  success: boolean
  data: PendingReportItem[]
}

export async function getPendingReport(): Promise<GetPendingReportResponse> {
  const response = await apiClient.get<GetPendingReportResponse>(
    '/reports/pending'
  )

  return response.data
}

// ============================================================
// STATISTICS REPORT
// GET /reports/statistics
// ============================================================

export interface StatisticsReport {
  period: ReportPeriod
  dateFrom: string
  dateTo: string
  received: number
  processed: number
  completed: number
  pending: number
  approved: number
  rejected: number
  pendingClarification: number
  sentBackForCorrection: number
  archived: number
  averageProcessingDays: number
}

export interface GetStatisticsResponse {
  success: boolean
  data: StatisticsReport
}

export async function getStatistics(
  period?: ReportPeriod
): Promise<GetStatisticsResponse> {
  const response = await apiClient.get<GetStatisticsResponse>(
    '/reports/statistics',
    period ? { params: { period } } : undefined
  )

  return response.data
}
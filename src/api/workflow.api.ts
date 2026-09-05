import apiClient from "./client"
import type { CaseItem } from './cases.api'

export interface WorkflowActionResponse {
    success: boolean
    message: string
    data: unknown
  }

export interface AssignCasePayload {
  toUnitId: string
  remarks?: string
}

export interface ReturnCasePayload {
    remarks: string
  }
  
  export interface TransferCasePayload {
    toUnitId: string
    remarks?: string
  }
  
  export interface ReassignCasePayload {
    toUnitId: string
    remarks?: string
  }
  
  export type DecisionType = 'APPROVED' | 'REJECTED'

  /*export interface DecisionPayload {
    decisionType: DecisionType
    decisionText?: string

  }*/
    export interface DecisionPayload {
      decisionType: 'APPROVED' | 'REJECTED'
      decisionText?: string
      archiveAfterApproval?: boolean // Add this
    }

export interface AssignCaseResponse {
  success: boolean
  message: string
  data: {
    case: {
      caseId: string
      trackingNumber: string
      status: string
      currentUnitId: string
    }
    assignment: {
      assignmentId: string
      caseId: string
      fromUnitId: string
      toUnitId: string
      assignmentStatus: string
      remarks: string | null
      assignedAt: string
      completedAt: string | null
    }
  }
}

export const assignCase = async (
  caseId: string,
  payload: AssignCasePayload
): Promise<AssignCaseResponse> => {
  const response = await apiClient.post<AssignCaseResponse>(
    `/workflow/cases/${caseId}/assign`,
    payload
  )

  return response.data
}

export async function returnCase(
    caseId: string,
    payload: ReturnCasePayload
  ): Promise<WorkflowActionResponse> {
    const response = await apiClient.post<WorkflowActionResponse>(
      `/workflow/cases/${caseId}/return`,
      payload
    )
    return response.data
  }
  
  export async function transferCase(
    caseId: string,
    payload: TransferCasePayload
  ): Promise<WorkflowActionResponse> {
    const response = await apiClient.post<WorkflowActionResponse>(
      `/workflow/cases/${caseId}/transfer`,
      payload
    )
    return response.data
  }
  

  export async function reassignCase(
    caseId: string,
    payload: ReassignCasePayload
  ): Promise<WorkflowActionResponse> {
    const response = await apiClient.post<WorkflowActionResponse>(
      `/workflow/cases/${caseId}/reassign`,
      payload
    )
    return response.data
  }
  
  export async function makeDecision(
    caseId: string,
    payload: DecisionPayload
  ): Promise<WorkflowActionResponse> {
    const response = await apiClient.post<WorkflowActionResponse>(
      `/workflow/cases/${caseId}/decision`,
      payload
    )
    return response.data
  }

  export async function getCaseHistory(
    caseId: string
  ): Promise<WorkflowActionResponse> {
    const response = await apiClient.get<WorkflowActionResponse>(
      `/workflow/cases/${caseId}/history`
    )
    return response.data
  }
  
  export async function getCaseRemarks(
    caseId: string
  ): Promise<WorkflowActionResponse> {
    const response = await apiClient.get<WorkflowActionResponse>(
      `/workflow/cases/${caseId}/remarks`
    )
    return response.data
  }

  export interface PreviouslyHandledCaseItem {
    case: CaseItem
    lastHandledAt: string
    lastWorkflowAction: {
      assignmentId: string
      fromUnit: { unitId: string; name: string; unitType: string } | null
      toUnit: { unitId: string; name: string; unitType: string } | null
      assignedAt: string
      completedAt: string | null
      remarks: string | null
    }
  }
  
  export interface GetPreviouslyHandledResponse {
    success: boolean
    message: string
    data: {
      unit: { unitId: string; name: string; unitType: string }
      count: number
      cases: PreviouslyHandledCaseItem[]
    }
  }
  
  export async function getPreviouslyHandledCases(): Promise<GetPreviouslyHandledResponse> {
    const response = await apiClient.get<GetPreviouslyHandledResponse>(
      '/workflow/previously-handled'
    )
    return response.data
  }
import apiClient from "./client"


export interface AssignCasePayload {
  toUnitId: string
  remarks?: string
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
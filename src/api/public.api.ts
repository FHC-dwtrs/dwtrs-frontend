import apiClient from './client'

export type PublicCaseStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'PENDING_CLARIFICATION'
  | 'SENT_BACK_FOR_CORRECTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'ARCHIVED'

export interface PublicTrackingResult {
  trackingNumber: string
  subject: string
  status: PublicCaseStatus
  submittedAt: string
  updatedAt: string
}

export interface TrackCaseResponse {
  success: boolean
  data: PublicTrackingResult
}

export async function trackCase(
  trackingNumber: string
): Promise<TrackCaseResponse> {
  const response = await apiClient.get<TrackCaseResponse>(
    `/public/track/${encodeURIComponent(trackingNumber)}`
  )
  return response.data
}
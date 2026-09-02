import apiClient from './client'

export interface CreateCasePayload {
  customer: {
    name: string
    phone: string
    email?: string
    address?: string
  }
  incomingReferenceNo: string
  subject: string
}

export interface CreateCaseResponse {
  success: boolean
  message: string
  data: {
    caseId: string
    customerId: string
    trackingNumber: string
    incomingReferenceNo: string
    subject: string
    status: string
    currentUnitId: string
    version: number
    submittedAt: string
    updatedAt: string
  }
}

export interface UploadDocumentResponse {
  success: boolean
  message: string
  data: {
    documentId: string
    caseId: string
    documentType: string
    title: string
    fileName: string
    storageKey: string
    mimeType: string
    fileSize: string
    checksum: string
  }
}

export interface UploadAttachmentResponse {
  success: boolean
  message: string
  data: {
    attachmentId: string
    documentId: string
    fileName: string
    storageKey: string
    mimeType: string
    fileSize: string
    checksum: string
  }
}

export interface CaseCustomer {
  customerId: string
  name: string
  phone: string
  email: string | null
  address: string | null
}

export interface CaseUnit {
  unitId: string
  name: string
  unitType: string
}

export type CaseStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'PENDING_CLARIFICATION'
  | 'SENT_BACK_FOR_CORRECTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'ARCHIVED'

  export interface CaseItem {
    caseId: string
    customerId: string
    trackingNumber: string
    incomingReferenceNo: string | null
    subject: string
    status: CaseStatus
    currentUnitId: string | null
  
    isArchived: boolean
    archivedAt: string | null
    archivedBy: string | null
  
    version: number
    submittedAt: string
    updatedAt: string
  
    customer: CaseCustomer
    currentUnit: CaseUnit | null
  }

export interface GetCasesResponse {
  success: boolean
  data: CaseItem[]
}

export interface GetCaseResponse {
  success: boolean
  data: CaseItem
}

export const getCases = async (): Promise<GetCasesResponse> => {
  const response = await apiClient.get<GetCasesResponse>('/cases')
  return response.data
}

export const getCaseById = async (
  caseId: string
): Promise<GetCaseResponse> => {
  const response = await apiClient.get<GetCaseResponse>(`/cases/${caseId}`)
  return response.data
}

export const createCase = async (
  payload: CreateCasePayload
): Promise<CreateCaseResponse> => {
  const response = await apiClient.post<CreateCaseResponse>(
    '/cases',
    payload
  )

  return response.data
}

export const uploadDocument = async (
  caseId: string,
  file: File,
  documentType: string,
  title: string
): Promise<UploadDocumentResponse> => {
  const formData = new FormData()

  formData.append('file', file)
  formData.append('documentType', documentType)
  formData.append('title', title)

  const response = await apiClient.post<UploadDocumentResponse>(
    `/cases/${caseId}/documents`,
    formData
  )

  return response.data
}

export const uploadAttachment = async (
  caseId: string,
  documentId: string,
  file: File
): Promise<UploadAttachmentResponse> => {
  const formData = new FormData()

  formData.append('file', file)

  const response = await apiClient.post<UploadAttachmentResponse>(
    `/cases/${caseId}/documents/${documentId}/attachments`,
    formData
  )

  return response.data
}

export interface ToggleArchivePayload {
  archived: boolean
}

export async function toggleCaseArchive(
  caseId: string,
  payload: ToggleArchivePayload
): Promise<GetCaseResponse> {
  const response = await apiClient.patch<GetCaseResponse>(
    `/cases/${caseId}/archive`,
    payload
  )

  return response.data
}
import apiClient from './client'

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

export interface DocumentItem {
  documentId: string
  caseId: string
  documentType: string
  title: string
  fileName: string
  storageKey: string
  mimeType: string
  fileSize: string
  checksum: string
  createdAt: string
  updatedAt: string
}

export interface ListDocumentsResponse {
  success: boolean
  message: string
  data: DocumentItem[]
}

/**
 * Upload the main document for a case
 */
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

/**
 * Get all documents belonging to a case
 */
export const getCaseDocuments = async (
  caseId: string
): Promise<ListDocumentsResponse> => {
  const response = await apiClient.get<ListDocumentsResponse>(
    `/cases/${caseId}/documents`
  )

  return response.data
}

/**
 * View / download a specific document
 *
 * The backend should return the file itself.
 */
export const viewDocument = async (
  caseId: string,
  documentId: string
): Promise<Blob> => {
  const response = await apiClient.get(
    `/cases/${caseId}/documents/${documentId}`,
    {
      responseType: 'blob',
    }
  )

  return response.data
}
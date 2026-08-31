import apiClient from './client'

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

export interface AttachmentItem {
  attachmentId: string
  documentId: string
  fileName: string
  storageKey: string
  mimeType: string
  fileSize: string
  checksum: string
  createdAt: string
  updatedAt: string
}

/**
 * Upload an attachment to a document
 */
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

/**
 * Get all attachments belonging to a document
 */
export const getDocumentAttachments = async (
  caseId: string,
  documentId: string
): Promise<{
  success: boolean
  message: string
  data: AttachmentItem[]
}> => {
  const response = await apiClient.get(
    `/cases/${caseId}/documents/${documentId}/attachments`
  )

  return response.data
}

/**
 * View / download an attachment
 */
export const viewAttachment = async (
  caseId: string,
  documentId: string,
  attachmentId: string
): Promise<Blob> => {
  const response = await apiClient.get(
    `/cases/${caseId}/documents/${documentId}/attachments/${attachmentId}`,
    {
      responseType: 'blob',
    }
  )

  return response.data
}
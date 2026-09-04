import apiClient from './client'

// ============================================================
// UPLOAD DOCUMENT
// ============================================================

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

// ============================================================
// DOCUMENT
// ============================================================

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

// ============================================================
// ATTACHMENT
// ============================================================

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

export interface GetDocumentAttachmentsResponse {
  success: boolean
  message: string
  data: AttachmentItem[]
}

// ============================================================
// UPLOAD MAIN DOCUMENT
// ============================================================

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

  const response =
    await apiClient.post<UploadDocumentResponse>(
      `/cases/${caseId}/documents`,
      formData
    )

  return response.data
}

// ============================================================
// LIST CASE DOCUMENTS
// ============================================================

/**
 * Get all documents belonging to a case
 */
export const getCaseDocuments = async (
  caseId: string
): Promise<ListDocumentsResponse> => {
  const response =
    await apiClient.get<ListDocumentsResponse>(
      `/cases/${caseId}/documents`
    )

  return response.data
}

// ============================================================
// VIEW / DOWNLOAD DOCUMENT
// ============================================================

/**
 * View / download a specific document.
 *
 * The backend returns the actual file as binary data.
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

// ============================================================
// LIST DOCUMENT ATTACHMENTS
// ============================================================

/**
 * Get all attachments belonging to a specific document
 */
export const getDocumentAttachments = async (
  caseId: string,
  documentId: string
): Promise<GetDocumentAttachmentsResponse> => {
  const response =
    await apiClient.get<GetDocumentAttachmentsResponse>(
      `/cases/${caseId}/documents/${documentId}/attachments`
    )

  return response.data
}

// ============================================================
// VIEW / DOWNLOAD ATTACHMENT
// ============================================================

/**
 * View / download a specific attachment.
 *
 * The backend returns the actual file as binary data.
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

// ============================================================
// UPDATE DOCUMENT
// PATCH /cases/{caseId}/documents/{documentId}
// ============================================================

export const updateDocument = async (
  caseId: string,
  documentId: string,
  file: File | null,
  documentType: string,
  title: string
) => {
  const formData = new FormData()

  if (file) {
    formData.append('file', file)
  }

  formData.append('documentType', documentType)
  formData.append('title', title)

  const response = await apiClient.patch(
    `/cases/${caseId}/documents/${documentId}`,
    formData
  )

  return response.data
}


// ============================================================
// UPDATE ATTACHMENT
// PATCH /cases/{caseId}/documents/{documentId}/attachments/{attachmentId}
// ============================================================

export const updateAttachment = async (
  caseId: string,
  documentId: string,
  attachmentId: string,
  file?: File
) => {
  const formData = new FormData()

  if (file) {
    formData.append('file', file)
  }

  const response = await apiClient.patch(
    `/cases/${caseId}/documents/${documentId}/attachments/${attachmentId}`,
    formData
  )

  return response.data
}


// ============================================================
// DELETE ATTACHMENT
// DELETE /cases/{caseId}/documents/{documentId}/attachments/{attachmentId}
// ============================================================

export const deleteAttachment = async (
  caseId: string,
  documentId: string,
  attachmentId: string
): Promise<void> => {
  await apiClient.delete(
    `/cases/${caseId}/documents/${documentId}/attachments/${attachmentId}`
  )
}
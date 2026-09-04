import { useState, useEffect } from 'react'
import {
  getCases,
  toggleCaseArchive,
  createCase,
  uploadAttachment,
  updateCase,
  type CaseItem,
} from '../api/cases.api'
import { formatCaseStatus, mapCaseToRecord } from '../utils/caseMappers'

import {
  assignCase,
  makeDecision,
  reassignCase,
  returnCase,
  transferCase,
  getCaseHistory,
  getCaseRemarks,
} from '../api/workflow.api'

import {
  uploadDocument,
  updateDocument,
  updateAttachment,
  deleteAttachment,
  getCaseDocuments,
  getDocumentAttachments,
  viewDocument,
  viewAttachment,
  type DocumentItem,
  type AttachmentItem,
} from '../api/documents.api'

import {
  getOrganization,
  getOrganizationChildren,
  getOrganizations,
  type OrganizationUnit,
} from '../api/organizations.api'

import {
  StatusBadge,
  KpiCard,
  Btn,
  Modal,
  Input,
  Textarea,
  Select,
  TabBar,
  EmptyState,
  PriorityBadge,
} from '../components/ui'

import type { CaseHistoryEntry, CaseRecord, CaseRemarkItem } from '../types'
import { useLanguage } from '../i18n'

interface Props {
  page: string
  setPage: (p: string) => void
}


export default function RecordsPage({ page, setPage }: Props) {
  const { t } = useLanguage()

  const [selectedCase, setSelectedCase] =
    useState<CaseRecord | null>(null)

  const [caseTab, setCaseTab] = useState('Overview')
  const [searchQ, setSearchQ] = useState('')

  const [documents, setDocuments] = useState<
    Array<DocumentItem & { caseId: string; subject: string }>
  >([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [documentsError, setDocumentsError] = useState('')

  const [cases, setCases] = useState<CaseItem[]>([])
  const [loadingCases, setLoadingCases] = useState(true)
  const [casesError, setCasesError] = useState('')

  async function loadCases() {
    try {
      setLoadingCases(true)
      setCasesError('')

      const result = await getCases()
      setCases(result.data ?? [])
    } catch (err: any) {
      console.error('Failed to load cases:', err)

      setCasesError(
        err.response?.data?.message || 'Failed to load cases.'
      )
    } finally {
      setLoadingCases(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  useEffect(() => {
    if (page !== 'documents' || cases.length === 0) return

    let cancelled = false

    async function loadAllDocuments() {
      try {
        setLoadingDocuments(true)
        setDocumentsError('')

        const records = cases.map(mapCaseToRecord)

        const results = await Promise.all(
          records.map(async c => {
            const caseId = c.caseId
        
            if (!caseId) {
              return []
            }
        
            const response = await getCaseDocuments(caseId)
        
            return (response.data ?? []).map(document => ({
              ...document,
              caseId,
              subject: c.subject,
            }))
          })
        )

        if (!cancelled) {
          setDocuments(results.flat())
        }
      } catch (err: any) {
        if (cancelled) return

        console.error('Failed to load documents:', err)
        setDocumentsError(
          err.response?.data?.message ||
            'Failed to load documents.'
        )
      } finally {
        if (!cancelled) setLoadingDocuments(false)
      }
    }

    loadAllDocuments()

    return () => {
      cancelled = true
    }
  }, [page, cases])

  async function handleViewDocument(
    caseId: string,
    documentId: string
  ) {
    try {
      const blob = await viewDocument(caseId, documentId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')

      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err: any) {
      console.error('Failed to view document:', err)
      setDocumentsError(
        err.response?.data?.message ||
          'Failed to view document.'
      )
    }
  }

  function openCase(c: CaseRecord) {
    setSelectedCase(c)
    setPage('case-detail')
    setCaseTab('Overview')
  }

  /*
   * Archive / unarchive a case.
   *
   * Backend:
   * PATCH /cases/{caseId}/archive
   *
   * Body:
   * {
   *   archived: true | false
   * }
   */
  async function handleArchive(
    caseId: string,
    archived: boolean
  ) {
    try {
      setCasesError('')

      await toggleCaseArchive(caseId, archived)

      await loadCases()

      setSelectedCase(null)
      setPage(archived ? 'archive' : 'cases')
    } catch (err: any) {
      console.error(
        'Failed to update archive status:',
        err
      )

      setCasesError(
        err.response?.data?.message ||
          'Failed to update case archive status.'
      )
    }
  }

  if (page === 'register') {
    return (
      <RegisterCaseForm
        onSuccess={() => {
          loadCases()
          setPage('cases')
        }}
      />
    )
  }

  if (page === 'case-detail' && selectedCase) {
    return (
      <CaseDetail
        c={selectedCase}
        tab={caseTab}
        setTab={setCaseTab}
        onBack={() => {
          setSelectedCase(null)
          setPage('cases')
        }}
        role="records"
        onActionComplete={() => {
          loadCases()
          setSelectedCase(null)
          setPage('cases')
        }}
        
onArchive={(archived) => {
  if (!selectedCase.caseId) return;

  handleArchive(selectedCase.caseId, archived);
}}
      />
    )
  }

  const myCases = cases.map(mapCaseToRecord).filter(
    c =>
      (
        page === 'archived'
          ? c.status === 'Archived'
          : page === 'registered'
            ? true
            : page === 'returned'
            ? c.status === 'Returned'
              : true
      ) &&
      (
        c.subject.toLowerCase().includes(searchQ.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQ.toLowerCase()) ||
        c.customer.toLowerCase().includes(searchQ.toLowerCase())
      )
  )

  // ─────────────────────────────────────────────
  // Returned
  // ─────────────────────────────────────────────

  if (page === 'returned') {
    const returnedCases = cases
      .map(mapCaseToRecord)
      .filter(c => c.status === 'Returned')

    return (
      <div className="p-6">
        <h2
          className="text-xl font-black text-gray-900 mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('returned') || 'Returned Cases'}
        </h2>

        <CasesTable
          cases={returnedCases}
          onOpen={openCase}
        />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Documents
  // ─────────────────────────────────────────────

  if (page === 'documents') {
    return (
      <div className="p-6">
        <h2
          className="text-xl font-black text-gray-900 mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('documents')}
        </h2>

        {loadingDocuments ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-500">
            Loading documents...
          </div>
        ) : documentsError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {documentsError}
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100">
            <EmptyState
              icon="📄"
              title="No documents yet"
              sub="No documents were found for the available cases."
            />
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map(document => (
              <div
                key={document.documentId}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">
                  📄
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {document.fileName}
                  </p>

                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {document.title} · {document.documentType}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {document.fileSize} · {new Date(document.createdAt).toLocaleString()} · {document.caseId}
                  </p>
                </div>

                <Btn
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleViewDocument(
                      document.caseId,
                      document.documentId
                    )
                  }
                >
                  View
                </Btn>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Archive
  // ─────────────────────────────────────────────

  if (page === 'archive') {
    const archivedCases = cases
      .map(mapCaseToRecord)
      .filter(c => c.isArchived)

    return (
      <div className="p-6">
        <h2
          className="text-xl font-black text-gray-900 mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('archive')}
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {loadingCases ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading archived cases...
            </div>
          ) : archivedCases.length === 0 ? (
            <EmptyState
              icon="🗃"
              title={t('empty_noCases')}
              sub="No archived cases found."
            />
          ) : (
            <CasesTable
              cases={archivedCases}
              onOpen={openCase}
            />
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Dashboard
  // ─────────────────────────────────────────────

  if (page === 'dashboard') {
    const today = new Date()

    const registeredToday = cases.filter(c => {
      const submitted = new Date(c.submittedAt)

      return (
        submitted.getFullYear() === today.getFullYear() &&
        submitted.getMonth() === today.getMonth() &&
        submitted.getDate() === today.getDate()
      )
    }).length

    const totalActive = cases.filter(c =>
      ![
        'APPROVED',
        'REJECTED',
        'COMPLETED',
        'ARCHIVED',
      ].includes(c.status)
    ).length

    const archivedCount = cases.filter(
      c => c.isArchived
    ).length

    return (
      <div className="p-6 space-y-6">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-[#1E4B8F] to-[#2558A8] rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-semibold mb-1">
              {t('goodMorning')}, Sara
            </p>

            <h1
              className="text-2xl font-black"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('recordsDashboard')}
            </h1>

            <p className="text-blue-200 text-sm mt-1">
              {t('todayIs')}
            </p>
          </div>

          <Btn
            onClick={() => setPage('register')}
            variant="secondary"
            size="lg"
            className="bg-white text-[#1E4B8F] border-0 font-black shadow-lg"
          >
            ➕ Register New Case
          </Btn>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <KpiCard
            label={t('kpi_registeredToday')}
            value={registeredToday}
            icon="📋"
            sub="Today"
          />

          <KpiCard
            label={t('kpi_totalActive')}
            value={totalActive}
            icon="🔄"
            accent="#1E4B8F"
          />

          <KpiCard
            label={t('kpi_archivedCases')}
            value={archivedCount}
            icon="🗃"
            accent="#6B7280"
          />

          <KpiCard
            label={t('kpi_pendingUpload')}
            value={cases.filter(
              c => c.status === 'SUBMITTED'
            ).length}
            icon="⚠️"
            accent="#D97706"
          />

        </div>

        {/* Recent cases */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('recentlyRegistered')}
            </h2>

            <button
              onClick={() => setPage('cases')}
              className="text-xs text-[#1E4B8F] font-semibold hover:underline"
            >
              {t('viewAll')}
            </button>
          </div>

          <CasesTable
            cases={cases
              .map(mapCaseToRecord)
              .slice(0, 5)}
            onOpen={openCase}
          />

        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Cases list
  // ─────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">

      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-black text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {page === 'archived'
            ? t('archivedCases')
            : page === 'registered'
              ? t('registeredCases')
              : t('allCases')}
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            value={searchQ}
            onChange={e =>
              setSearchQ(e.target.value)
            }
            placeholder="Search…"
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20"
          />

          <Btn onClick={() => setPage('register')}>
            ➕ {t('registerCase')}
          </Btn>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

        {loadingCases ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading cases...
          </div>
        ) : casesError ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {casesError}
            </div>
          </div>
        ) : (
          <CasesTable
            cases={myCases}
            onOpen={openCase}
          />
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Cases Table
// ─────────────────────────────────────────────────────

function CasesTable({
  cases,
  onOpen,
}: {
  cases: CaseRecord[]
  onOpen: (c: CaseRecord) => void
}) {
  const { t } = useLanguage()

  if (!cases.length) {
    return (
      <EmptyState
        icon="📁"
        title={t('empty_noCases')}
        sub={t('empty_noCasesDesc')}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">

        <thead>
          <tr className="border-b border-gray-100">
            {[
              t('col_trackingNo'),
              t('col_subject'),
              t('col_customer'),
              t('col_sector'),
              t('col_status'),
              t('col_priority'),
              t('col_date'),
              '',
            ].map(h => (
              <th
                key={h}
                className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {cases.map(c => (
            <tr
              key={c.id}
              onClick={() => onOpen(c)}
              className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-5 py-3.5 font-mono font-semibold text-[#1E4B8F] text-xs">
                {c.id}
              </td>

              <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[180px] truncate">
                {c.subject}
              </td>

              <td className="px-5 py-3.5 text-gray-600">
                {c.customer}
              </td>

              <td className="px-5 py-3.5 text-gray-500 text-xs">
                {c.sector}
              </td>

              <td className="px-5 py-3.5">
                <StatusBadge status={c.status} />
              </td>

              <td className="px-5 py-3.5">
                <PriorityBadge priority={c.priority} />
              </td>

              <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                {c.date}
              </td>

              <td className="px-5 py-3.5">
                <button className="text-xs text-[#1E4B8F] font-semibold hover:underline">
                  {t('view')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  )
}
//─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────
// Edit Case Form
// ─────────────────────────────────────────────────────

function EditCaseForm({
  caseId,
  documentId,
  trackingNumber,
  selectedSector,
  initialData,
  onCancel,
  onSaved,
}: {
  caseId: string
  documentId: string
  trackingNumber: string
  selectedSector: string
  initialData: {
    name: string
    phone: string
    email: string
    address: string
    subject: string
    reference: string
    notes: string
  }
  onCancel: () => void
  onSaved: () => void
}) {
  const [formData, setFormData] = useState({
    name: initialData.name,
    phone: initialData.phone,
    email: initialData.email,
    address: initialData.address,
    subject: initialData.subject,
    reference: initialData.reference,
  })

  const [document, setDocument] = useState<DocumentItem | null>(null)
  const [documentType, setDocumentType] = useState('')
  const [documentTitle, setDocumentTitle] = useState('')
  const [replacementDocument, setReplacementDocument] =
    useState<File | null>(null)

  const [existingAttachments, setExistingAttachments] =
    useState<AttachmentItem[]>([])
  const [attachmentReplacements, setAttachmentReplacements] =
    useState<Record<string, File>>({})
  const [attachmentsToDelete, setAttachmentsToDelete] =
    useState<string[]>([])
  const [newAttachments, setNewAttachments] =
    useState<File[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadEditData() {
      try {
        setLoading(true)
        setError('')

        const documentsResponse = await getCaseDocuments(caseId)
        const loadedDocuments = documentsResponse.data ?? []

        const loadedDocument =
          loadedDocuments.find(d => d.documentId === documentId) ??
          loadedDocuments[0] ??
          null

        if (!loadedDocument) {
          throw new Error('The main document could not be found.')
        }

        const attachmentsResponse =
          await getDocumentAttachments(caseId, loadedDocument.documentId)

        if (cancelled) return

        setDocument(loadedDocument)
        setDocumentType(loadedDocument.documentType)
        setDocumentTitle(loadedDocument.title)
        setExistingAttachments(attachmentsResponse.data ?? [])
      } catch (err: any) {
        if (cancelled) return

        console.error('Failed to load case for editing:', err)
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load the case for editing.'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadEditData()

    return () => {
      cancelled = true
    }
  }, [caseId, documentId])

  function updateField(key: keyof typeof formData, value: string) {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  function handleNewAttachments(files: File[]) {
    if (!files.length) return

    setNewAttachments(prev => [...prev, ...files])
  }

  function removeNewAttachment(index: number) {
    setNewAttachments(prev => prev.filter((_, i) => i !== index))
  }

  function markAttachmentForDelete(attachmentId: string) {
    setAttachmentsToDelete(prev =>
      prev.includes(attachmentId)
        ? prev
        : [...prev, attachmentId]
    )
  }

  function undoAttachmentDelete(attachmentId: string) {
    setAttachmentsToDelete(prev =>
      prev.filter(id => id !== attachmentId)
    )
  }

  function setAttachmentReplacement(
    attachmentId: string,
    file: File | undefined
  ) {
    if (!file) return

    setAttachmentReplacements(prev => ({
      ...prev,
      [attachmentId]: file,
    }))
  }

  async function handleSave() {
    setError('')

    if (!formData.name.trim()) {
      setError('Please enter the customer name.')
      return
    }

    if (!formData.phone.trim()) {
      setError('Please enter the customer phone number.')
      return
    }

    if (!formData.subject.trim()) {
      setError('Please enter the case subject.')
      return
    }

    if (!formData.reference.trim()) {
      setError('Please enter the incoming reference number.')
      return
    }

    if (!document) {
      setError('The main document could not be found.')
      return
    }

    if (!documentTitle.trim()) {
      setError('Please enter the document title.')
      return
    }

    if (!documentType.trim()) {
      setError('Please select a document type.')
      return
    }

    setSaving(true)

    try {
      // 1. UPDATE CASE
      // Only fields supported by PATCH /cases/{caseId} are sent.
      // Tracking number and selected Sector are intentionally NOT sent.
      await updateCase(caseId, {
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          address: formData.address.trim() || undefined,
        },
        incomingReferenceNo: formData.reference.trim(),
        subject: formData.subject.trim(),
      })

      // 2. UPDATE MAIN DOCUMENT METADATA / OPTIONAL FILE
      await updateDocument(
        caseId,
        document.documentId,
        replacementDocument,
        documentType.trim(),
        documentTitle.trim()
      )

      // 3. REPLACE EXISTING ATTACHMENTS
      for (const attachment of existingAttachments) {
        if (attachmentsToDelete.includes(attachment.attachmentId)) {
          continue
        }

        const replacement =
          attachmentReplacements[attachment.attachmentId]

        if (replacement) {
          await updateAttachment(
            caseId,
            document.documentId,
            attachment.attachmentId,
            replacement
          )
        }
      }

      // 4. DELETE SELECTED EXISTING ATTACHMENTS
      for (const attachmentId of attachmentsToDelete) {
        await deleteAttachment(
          caseId,
          document.documentId,
          attachmentId
        )
      }

      // 5. ADD NEW ATTACHMENTS
      for (const file of newAttachments) {
        await uploadAttachment(
          caseId,
          document.documentId,
          file
        )
      }

      onSaved()
    } catch (err: any) {
      console.error('Failed to save case edits:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to save the case changes.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-500">
            Loading case information...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 mb-2"
              disabled={saving}
            >
              ← Back
            </button>

            <h2
              className="text-xl font-black text-gray-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Edit Case
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Update the case information and documents.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <div className="flex items-start gap-2">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* IDENTIFIERS — READ ONLY */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="font-bold text-gray-800 mb-4">
            Case Information
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                Tracking Number
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <p className="font-mono font-bold text-[#1E4B8F]">
                  {trackingNumber}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Tracking number cannot be changed.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                Selected Sector
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <p className="font-semibold text-gray-700">
                  {selectedSector || 'Selected Sector'}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Sector cannot be changed from Edit Case.
              </p>
            </div>
          </div>
        </div>

        {/* CUSTOMER INFORMATION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="font-bold text-gray-800 mb-4">
            Customer Information
          </h3>

          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={e =>
                updateField('name', e.target.value)
              }
              placeholder="Enter customer name"
            />

            <Input
              label="Phone"
              value={formData.phone}
              onChange={e =>
                updateField('phone', e.target.value)
              }
              placeholder="Enter phone number"
            />

            <Input
              label="Email"
              value={formData.email}
              onChange={e =>
                updateField('email', e.target.value)
              }
              placeholder="Enter email address"
              type="email"
            />

            <Textarea
              label="Address"
              value={formData.address}
              onChange={e =>
                updateField('address', e.target.value)
              }
              placeholder="Enter address"
              rows={2}
            />
          </div>
        </div>

        {/* CASE DETAILS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="font-bold text-gray-800 mb-4">
            Case Details
          </h3>

          <div className="space-y-4">
            <Input
              label="Subject"
              value={formData.subject}
              onChange={e =>
                updateField('subject', e.target.value)
              }
              placeholder="Enter case subject"
            />

            <Input
              label="Incoming Reference Number"
              value={formData.reference}
              onChange={e =>
                updateField('reference', e.target.value)
              }
              placeholder="Enter incoming reference number"
            />

              <div className="grid md:grid-cols-2 gap-4">

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                  Additional Note (Remark)
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 min-h-[44px]">
                  {initialData.notes || 'No remark'}
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  This is a workflow remark. It is read-only and cannot be changed from Edit Case.
                </p>
              </div>

              </div>
          </div>
        </div>

        {/* MAIN DOCUMENT */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="font-bold text-gray-800 mb-4">
            Main Document
          </h3>

          <div className="space-y-4">
            <Input
              label="Document Title"
              value={documentTitle}
              onChange={e =>
                setDocumentTitle(e.target.value)
              }
              placeholder="Enter document title"
            />

            <Select
              label="Document Type"
              value={documentType}
              onChange={e =>
                setDocumentType(e.target.value)
              }
              options={[
                {
                  value: 'Application Form',
                  label: 'Application Form',
                },
                {
                  value: 'Official Letter',
                  label: 'Official Letter',
                },
                {
                  value: 'Request Letter',
                  label: 'Request Letter',
                },
                {
                  value: 'Report',
                  label: 'Report',
                },
                {
                  value: 'Other',
                  label: 'Other',
                },
              ]}
            />

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                Current File
              </p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {document?.fileName || 'No file name available'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Choose a new file only if you want to replace the current main document.
              </p>
            </div>

            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-[#1E4B8F]/40 transition-colors cursor-pointer bg-gray-50">
              <input
                type="file"
                className="hidden"
                onChange={e =>
                  setReplacementDocument(
                    e.target.files?.[0] || null
                  )
                }
              />

              <div className="text-2xl mb-1">📄</div>

              {replacementDocument ? (
                <>
                  <p className="text-sm font-semibold text-[#1E4B8F]">
                    {replacementDocument.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    This file will replace the current main document.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Click to choose a replacement file
                </p>
              )}
            </label>
          </div>
        </div>

        {/* EXISTING ATTACHMENTS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="font-bold text-gray-800 mb-4">
            Existing Attachments
          </h3>

          {existingAttachments.length === 0 ? (
            <p className="text-sm text-gray-400">
              No attachments.
            </p>
          ) : (
            <div className="space-y-3">
              {existingAttachments.map(attachment => {
                const deleted =
                  attachmentsToDelete.includes(
                    attachment.attachmentId
                  )

                const replacement =
                  attachmentReplacements[
                    attachment.attachmentId
                  ]

                return (
                  <div
                    key={attachment.attachmentId}
                    className={`border rounded-xl p-4 ${
                      deleted
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            deleted
                              ? 'text-red-700 line-through'
                              : 'text-gray-800'
                          }`}
                        >
                          {attachment.fileName}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {attachment.mimeType} ·{' '}
                          {String(attachment.fileSize)}
                        </p>
                      </div>

                      {deleted ? (
                        <button
                          type="button"
                          onClick={() =>
                            undoAttachmentDelete(
                              attachment.attachmentId
                            )
                          }
                          className="text-xs text-[#1E4B8F] font-semibold hover:underline flex-shrink-0"
                          disabled={saving}
                        >
                          Undo Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            markAttachmentForDelete(
                              attachment.attachmentId
                            )
                          }
                          className="text-xs text-red-500 font-semibold hover:underline flex-shrink-0"
                          disabled={saving}
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {!deleted && (
                      <div className="mt-3">
                        <label className="inline-flex items-center text-xs text-[#1E4B8F] font-semibold cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={e =>
                              setAttachmentReplacement(
                                attachment.attachmentId,
                                e.target.files?.[0]
                              )
                            }
                          />
                          Replace File
                        </label>

                        {replacement && (
                          <p className="text-xs text-green-600 mt-2">
                            Replacement selected: {replacement.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ADD ATTACHMENTS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">
            Add Attachments
          </h3>

          <label className="block border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-[#1E4B8F]/40 transition-colors cursor-pointer bg-gray-50">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={e => {
                handleNewAttachments(
                  Array.from(e.target.files || [])
                )
                e.currentTarget.value = ''
              }}
            />

            <div className="text-2xl mb-1">📎</div>
            <p className="text-sm text-gray-500">
              Click to add attachment files
            </p>
          </label>

          {newAttachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {newAttachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                >
                  <p className="text-sm text-gray-700 truncate">
                    {file.name}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      removeNewAttachment(index)
                    }
                    className="text-xs text-red-500 hover:underline flex-shrink-0"
                    disabled={saving}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <Btn
            variant="secondary"
            onClick={onCancel}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Btn>

          <Btn
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : '✓ Save Changes'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────

function RegisterCaseForm({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const { t } = useLanguage()

  const [step, setStep] =
    useState<1 | 2 | 3 | 'done'>(1)
   
  const [sector, setSector] = useState('')

  const [sectors, setSectors] =
    useState<OrganizationUnit[]>([])

  const [loadingSectors, setLoadingSectors] =
    useState(false)

  const [sectorsError, setSectorsError] =
    useState('')

    const [editOpen, setEditOpen] = useState(false)
    const [editSaved, setEditSaved] = useState(false)

  useEffect(() => {
    async function loadSectors() {
      try {
        setLoadingSectors(true)
        setSectorsError('')

        const result = await getOrganizations({
          unitType: 'SECTOR',
          isActive: true,
        })

        setSectors(result.data ?? [])
      } catch (err: any) {
        console.error(
          'Failed to load sectors:',
          err
        )

        setSectorsError(
          err.response?.data?.message ||
            'Failed to load sectors.'
        )
      } finally {
        setLoadingSectors(false)
      }
    }

    loadSectors()
  }, [])

  const [mainDocument, setMainDocument] =
    useState<File | null>(null)

  const [attachments, setAttachments] =
    useState<File[]>([])

  const [documentType, setDocumentType] =
    useState('Application Form')

  const [documentTitle, setDocumentTitle] =
    useState('')

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [error, setError] = useState('')

  const [registrationResult, setRegistrationResult] =
    useState<{
      caseId: string
      documentId: string
      trackingNumber: string
    } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    subject: '',
    reference: '',
    notes: '',
  })

  const selectedSector =
    sectors.find(s => s.unitId === sector)

  function update(k: string, v: string) {
    setFormData(f => ({
      ...f,
      [k]: v,
    }))
  }

  function resetForm() {
    setStep(1)
    setSector('')
    setMainDocument(null)
    setAttachments([])
    setDocumentType('Application Form')
    setDocumentTitle('')
    setError('')
    setRegistrationResult(null)

    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      subject: '',
      reference: '',
      notes: '',
    })
  }

  async function handleRegisterCase() {
    setError('')

    if (!formData.name.trim()) {
      setError(
        'Please enter the customer name.'
      )
      setStep(1)
      return
    }

    if (!formData.phone.trim()) {
      setError(
        'Please enter the customer phone number.'
      )
      setStep(1)
      return
    }

    if (!formData.subject.trim()) {
      setError(
        'Please enter the case subject.'
      )
      setStep(2)
      return
    }

    if (!formData.reference.trim()) {
      setError(
        'Please enter the incoming reference number.'
      )
      setStep(2)
      return
    }

    if (!mainDocument) {
      setError(
        'Please upload the main document.'
      )
      return
    }

    if (!documentTitle.trim()) {
      setError(
        'Please enter the document title.'
      )
      return
    }

    if (!documentType.trim()) {
      setError(
        'Please select a document type.'
      )
      return
    }

    if (!sector) {
      setError(
        'Please select a sector.'
      )
      return
    }

    setIsSubmitting(true)

    let createdCaseId: string | null = null
    let createdDocumentId: string | null = null

    try {
      // 1. CREATE CASE
      const caseResponse = await createCase({
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email:
            formData.email.trim() ||
            undefined,
          address:
            formData.address.trim() ||
            undefined,
        },

        incomingReferenceNo:
          formData.reference.trim(),

        subject:
          formData.subject.trim(),
      })

      createdCaseId =
        caseResponse.data.caseId

      const trackingNumber =
        caseResponse.data.trackingNumber

      // 2. UPLOAD MAIN DOCUMENT
      const documentResponse =
        await uploadDocument(
          createdCaseId,
          mainDocument,
          documentType,
          documentTitle.trim()
        )

      createdDocumentId =
        documentResponse.data.documentId

      // 3. UPLOAD ATTACHMENTS
      for (const attachment of attachments) {
        await uploadAttachment(
          createdCaseId,
          createdDocumentId,
          attachment
        )
      }

      // 4. ASSIGN TO SELECTED SECTOR
      await assignCase(createdCaseId, {
        toUnitId: sector,
        remarks:
          formData.notes.trim() ||
          undefined,
      })

      // 5. SUCCESS
      if (!createdDocumentId) {
        throw new Error(
          'Main document was not created.'
        )
      }

      setRegistrationResult({
        caseId: createdCaseId,
        documentId: createdDocumentId,
        trackingNumber,
      })

      setStep('done')
    } catch (err: any) {
      console.error(
        'Case registration failed:',
        err
      )

      if (
        createdCaseId &&
        !createdDocumentId
      ) {
        setError(
          `Case ${createdCaseId} was created, but the main document could not be uploaded. Please do not register the case again.`
        )
      } else if (
        createdCaseId &&
        createdDocumentId
      ) {
        setError(
          `The case and document were created, but the case could not be sent to the selected sector. Please do not register the case again.`
        )
      } else {
        setError(
          err?.response?.data?.message ||
            'Unable to register the case. Please check the information and try again.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'done') {
    if (editSaved) {
      return (
        <div className="p-6 flex justify-center">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
  
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
              ✅
            </div>
  
            <h2
              className="text-xl font-black text-gray-900 mb-2"
              style={{
                fontFamily: 'var(--font-display)',
              }}
            >
              Case Updated Successfully
            </h2>
  
            <p className="text-gray-500 text-sm mb-6">
              The case information and documents have been updated successfully.
            </p>
  
            <Btn
              onClick={onSuccess}
              className="w-full"
            >
              View All Cases
            </Btn>
  
          </div>
        </div>
      )
    }
    if (editOpen && registrationResult) {
      return (
        <EditCaseForm
          caseId={registrationResult.caseId}
          documentId={registrationResult.documentId}
          trackingNumber={registrationResult.trackingNumber}
          selectedSector={
            selectedSector?.name ?? 'Selected Sector'
          }
          initialData={formData}
          onCancel={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            setEditSaved(true)
          }}
        />
      )
    }
    return (
      <div className="p-6 flex justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
            ✅
          </div>

          <h2
            className="text-xl font-black text-gray-900 mb-2"
            style={{
              fontFamily:
                'var(--font-display)',
            }}
          >
            {t('caseRegisteredTitle')}
          </h2>

          <p className="text-gray-500 text-sm mb-4">
            {t('caseRegisteredDesc')}
          </p>

          <div className="bg-[#EEF4FF] rounded-xl p-4 mb-6">

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
              {t('trackingNumber')}
            </p>

            <p className="text-2xl font-black text-[#1E4B8F] font-mono">
              {registrationResult?.trackingNumber}
            </p>

            <p className="text-xs text-gray-500 mt-2">
              {t('assignedTo')}{' '}
              <span className="font-semibold text-gray-700">
                {selectedSector?.name ??
                  'Selected Sector'}
              </span>
            </p>
          </div>

          <div className="flex gap-3">
          <Btn
              onClick={() => {
                setEditSaved(false)
                setEditOpen(true)
              }}
              className="flex-1"
            >
              ✏️ Edit Case
            </Btn>

            <Btn
              onClick={resetForm}
              variant="secondary"
              className="flex-1"
            >
              {t('registerAnother')}
            </Btn>

           {/* <Btn
              onClick={onSuccess}
              className="flex-1"
            >
              {t('viewCases')}
            </Btn>*/}

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">

      <div className="flex items-center gap-3 mb-6">

        <button
          onClick={onSuccess}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ←
        </button>

        <h2
          className="text-xl font-black text-gray-900"
          style={{
            fontFamily:
              'var(--font-display)',
          }}
        >
          {t('registerNewCaseTitle')}
        </h2>

      </div>

      {error && (
        <div className="max-w-xl mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-start gap-2">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-8">

        {[
          t('step_customerInfo'),
          t('step_caseDetails'),
          t('step_docsSector'),
        ].map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-2"
          >

            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1
                  ? 'bg-green-500 text-white'
                  : step === i + 1
                    ? 'bg-[#1E4B8F] text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > i + 1
                ? '✓'
                : i + 1}
            </div>

            <span
              className={`text-xs font-semibold ${
                step === i + 1
                  ? 'text-gray-900'
                  : 'text-gray-400'
              }`}
            >
              {s}
            </span>

            {i < 2 && (
              <span className="text-gray-200 mx-1">
                —
              </span>
            )}

          </div>
        ))}
      </div>

      <div className="max-w-xl">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

            <h3 className="font-bold text-gray-800 mb-2">
              {t('customerInformation')}
            </h3>

            <Input
              label={t('label_fullName')}
              value={formData.name}
              onChange={e =>
                update(
                  'name',
                  e.target.value
                )
              }
              placeholder={t('ph_name')}
            />

            <Input
              label={t('label_phone')}
              value={formData.phone}
              onChange={e =>
                update(
                  'phone',
                  e.target.value
                )
              }
              placeholder={t('ph_phone')}
            />

            <Input
              label={t('label_email')}
              value={formData.email}
              onChange={e =>
                update(
                  'email',
                  e.target.value
                )
              }
              placeholder={t('ph_email')}
              type="email"
            />

            <Textarea
              label={t('label_address')}
              value={formData.address}
              onChange={e =>
                update(
                  'address',
                  e.target.value
                )
              }
              placeholder={t('ph_address')}
              rows={2}
            />

            <div className="flex justify-end pt-2">
              <Btn
                onClick={() => {
                  setError('')
                  setStep(2)
                }}
                disabled={
                  !formData.name.trim() ||
                  !formData.phone.trim()
                }
              >
                {t('nextBtn')}
              </Btn>
            </div>

          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

            <h3 className="font-bold text-gray-800 mb-2">
              {t('caseInformation')}
            </h3>

            <Input
              label={t('label_subject')}
              value={formData.subject}
              onChange={e =>
                update(
                  'subject',
                  e.target.value
                )
              }
              placeholder={t('ph_subject')}
            />

            <Input
              label={t('label_incomingRef')}
              value={formData.reference}
              onChange={e =>
                update(
                  'reference',
                  e.target.value
                )
              }
              placeholder={t('ph_ref')}
            />

            <Textarea
              label={t('label_notes')}
              value={formData.notes}
              onChange={e =>
                update(
                  'notes',
                  e.target.value
                )
              }
              placeholder={t('ph_notes')}
              rows={3}
            />

            <div className="flex justify-between pt-2">

              <Btn
                variant="secondary"
                onClick={() => {
                  setError('')
                  setStep(1)
                }}
              >
                {t('backBtn')}
              </Btn>

              <Btn
                onClick={() => {
                  setError('')
                  setStep(3)
                }}
                disabled={
                  !formData.subject.trim() ||
                  !formData.reference.trim()
                }
              >
                {t('nextBtn')}
              </Btn>

            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

            <h3 className="font-bold text-gray-800 mb-2">
              {t('step_docsSector')}
            </h3>

            <Input
              label="Document Title"
              value={documentTitle}
              onChange={e =>
                setDocumentTitle(
                  e.target.value
                )
              }
              placeholder="Enter document title"
            />

            <Select
              label="Document Type"
              value={documentType}
              onChange={e =>
                setDocumentType(
                  e.target.value
                )
              }
              options={[
                {
                  value: 'Application Form',
                  label: 'Application Form',
                },
                {
                  value: 'Official Letter',
                  label: 'Official Letter',
                },
                {
                  value: 'Request Letter',
                  label: 'Request Letter',
                },
                {
                  value: 'Report',
                  label: 'Report',
                },
                {
                  value: 'Other',
                  label: 'Other',
                },
              ]}
            />

            {/* MAIN DOCUMENT */}
            <div>

              <p className="text-xs font-bold text-gray-600 mb-2">
                {t('label_mainDoc')} *
              </p>

              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#1E4B8F]/40 transition-colors cursor-pointer bg-gray-50">

                <input
                  type="file"
                  className="hidden"
                  onChange={e => {
                    const file =
                      e.target.files?.[0] ||
                      null

                    setMainDocument(file)

                    if (file) {
                      setError('')
                    }
                  }}
                />

                <div className="text-3xl mb-2">
                  📄
                </div>

                {mainDocument ? (
                  <>
                    <p className="text-sm font-semibold text-[#1E4B8F]">
                      {mainDocument.name}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {(
                        mainDocument.size /
                        1024 /
                        1024
                      ).toFixed(2)}{' '}
                      MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-600">
                      {t('uploadHint')}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {t('uploadSub')}
                    </p>
                  </>
                )}

              </label>
            </div>

            {/* ATTACHMENTS */}
            <div>

              <p className="text-xs font-bold text-gray-600 mb-2">
                {t('label_attachments')}
              </p>

              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#1E4B8F]/40 transition-colors cursor-pointer bg-gray-50">

                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => {
                    const files =
                      Array.from(
                        e.target.files || []
                      )

                    setAttachments(prev => [
                      ...prev,
                      ...files,
                    ])

                    e.currentTarget.value = ''
                  }}
                />

                <div className="text-2xl mb-1">
                  📎
                </div>

                <p className="text-sm text-gray-500">
                  {t('uploadMore')}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  You can select multiple files
                </p>

              </label>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">

                  {attachments.map(
                    (file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                      >

                        <div className="flex items-center gap-2 min-w-0">

                          <span>📎</span>

                          <div className="min-w-0">
                            <p className="text-sm text-gray-700 truncate">
                              {file.name}
                            </p>

                            <p className="text-xs text-gray-400">
                              {(
                                file.size /
                                1024 /
                                1024
                              ).toFixed(2)}{' '}
                              MB
                            </p>
                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setAttachments(prev =>
                              prev.filter(
                                (_, i) =>
                                  i !== index
                              )
                            )
                          }
                          className="text-xs text-red-500 hover:underline ml-3 flex-shrink-0"
                        >
                          Remove
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* SELECT SECTOR */}
            <div>

              <p className="text-xs font-bold text-gray-600 mb-2">
                {t('label_selectSector')} *
              </p>

              {loadingSectors ? (
                <p className="text-sm text-gray-400">
                  Loading sectors...
                </p>
              ) : sectorsError ? (
                <p className="text-sm text-red-500">
                  {sectorsError}
                </p>
              ) : sectors.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No active sectors available.
                </p>
              ) : (
                <div className="space-y-2">

                  {sectors.map(s => (
                    <button
                      type="button"
                      key={s.unitId}
                      onClick={() => {
                        setSector(
                          s.unitId
                        )
                        setError('')
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        sector === s.unitId
                          ? 'border-[#1E4B8F] bg-[#EEF4FF] text-[#1E4B8F]'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}

                </div>
              )}

              {selectedSector && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">

                  <p className="text-xs text-gray-500">
                    Selected sector
                  </p>

                  <p className="text-sm font-semibold text-[#1E4B8F]">
                    {selectedSector.name}
                  </p>

                </div>
              )}

            </div>

            {/* BUTTONS */}
            <div className="flex justify-between pt-2">

              <Btn
                variant="secondary"
                onClick={() => {
                  setError('')
                  setStep(2)
                }}
                disabled={isSubmitting}
              >
                {t('backBtn')}
              </Btn>

              <Btn
                onClick={handleRegisterCase}
                disabled={
                  !sector ||
                  !mainDocument ||
                  !documentTitle.trim() ||
                  !documentType.trim() ||
                  isSubmitting
                }
                variant="success"
              >
                {isSubmitting
                  ? 'Registering...'
                  : `✓ ${t('registerCase')}`}
              </Btn>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Case Detail
// ─────────────────────────────────────────────────────

export function CaseDetail({
  c,
  tab,
  setTab,
  onBack,
  role,
  onActionComplete,
  onArchive,
}: {
  c: CaseRecord
  tab: string
  setTab: (t: string) => void
  onBack: () => void
  role: string
  onActionComplete?: () => void
  onArchive?: (archived: boolean) => void
}) {
  const { t } = useLanguage()

  const [approveOpen, setApproveOpen] =
    useState(false)

  const [rejectOpen, setRejectOpen] =
    useState(false)

  const [returnOpen, setReturnOpen] =
    useState(false)

    const [transferOpen, setTransferOpen] =
    useState(false)
  
  const [transferUnits, setTransferUnits] =
    useState<OrganizationUnit[]>([])
  
  const [selectedTransferUnitId, setSelectedTransferUnitId] =
    useState('')
  
  const [loadingTransferUnits, setLoadingTransferUnits] =
    useState(false)
  
  const [transferUnitsError, setTransferUnitsError] =
    useState('')
  
  const [transferRemark, setTransferRemark] =
    useState('')

  const [archiveAfterApproval, setArchiveAfterApproval] =
    useState(false)

  const [assignOpen, setAssignOpen] =
    useState(false)

  const [assignMode, setAssignMode] =
    useState<'assign' | 'reassign'>('assign')

  const [assignUnits, setAssignUnits] =
    useState<OrganizationUnit[]>([])

  const [selectedUnitId, setSelectedUnitId] =
    useState('')

  const [loadingAssignUnits, setLoadingAssignUnits] =
    useState(false)

  const [assignUnitsError, setAssignUnitsError] =
    useState('')

  const [remarkText, setRemarkText] =
    useState('')

  const [rejectReason, setRejectReason] =
    useState('')

  const [returnReason, setReturnReason] =
    useState('')

  const [workSummary, setWorkSummary] =
    useState('')

  const [submitting, setSubmitting] =
    useState(false)

  const [actionError, setActionError] =
    useState('')

  // ─────────────────────────────────────────────
  // History / Remarks (Workflow + Remarks tabs)
  // ─────────────────────────────────────────────

  const [history, setHistory] =
    useState<CaseHistoryEntry[]>([])

  const [remarks, setRemarks] =
    useState<CaseRemarkItem[]>([])

  const [loadingTabs, setLoadingTabs] =
    useState(true)

  const [tabsError, setTabsError] =
    useState('')

  const [documents, setDocuments] =
    useState<DocumentItem[]>([])

  const [attachments, setAttachments] =
    useState<Record<string, AttachmentItem[]>>({})

  const [loadingDocuments, setLoadingDocuments] =
    useState(false)

  const [documentsError, setDocumentsError] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadTabData() {
      if (!c.caseId) return

      setLoadingTabs(true)
      setTabsError('')

      try {
        const [historyRes, remarksRes] =
          await Promise.all([
            getCaseHistory(c.caseId),
            getCaseRemarks(c.caseId),
          ])

        if (cancelled) return

        setHistory(
          (historyRes as any).data?.timeline ?? []
        )
        setRemarks(
          (remarksRes as any).data ?? []
        )
      } catch (err: any) {
        if (cancelled) return

        console.error(
          'Failed to load case history/remarks:',
          err
        )

        setTabsError(
          err.response?.data?.message ||
            'Failed to load workflow history.'
        )
      } finally {
        if (!cancelled) setLoadingTabs(false)
      }
    }

    loadTabData()

    return () => {
      cancelled = true
    }
  }, [c.caseId])

  useEffect(() => {
    let cancelled = false

    async function loadDocuments() {
      if (!c.caseId) return

      setLoadingDocuments(true)
      setDocumentsError('')

      try {
        const documentsResponse = await getCaseDocuments(c.caseId)
        const loadedDocuments = documentsResponse.data ?? []

        if (cancelled) return

        setDocuments(loadedDocuments)
          
        const attachmentResults = await Promise.all(
          loadedDocuments.map(async document => {
            if (!c.caseId) {
              return
            }
            try {
             
              const response = await getDocumentAttachments(
                c.caseId,
                document.documentId
              )

              return {
                documentId: document.documentId,
                attachments: response.data ?? [],
              }
            } catch (err) {
              console.error(
                `Failed to load attachments for document ${document.documentId}:`,
                err
              )

              return {
                documentId: document.documentId,
                attachments: [],
              }
            }
          })
        )

        if (cancelled) return

        const attachmentMap: Record<string, AttachmentItem[]> = {}

        attachmentResults.forEach(result => {
          if (!result) return
        
          attachmentMap[result.documentId] = result.attachments
        })

        setAttachments(attachmentMap)
      } catch (err: any) {
        if (cancelled) return

        console.error('Failed to load case documents:', err)
        setDocumentsError(
          err.response?.data?.message ||
            'Failed to load case documents.'
        )
        setDocuments([])
        setAttachments({})
      } finally {
        if (!cancelled) setLoadingDocuments(false)
      }
    }

    loadDocuments()

    return () => {
      cancelled = true
    }
  }, [c.caseId])

  async function handleViewCaseDocument(documentId: string) {
    if (!c.caseId) {
      return
    }
    try {
      const blob = await viewDocument(c.caseId, documentId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')

      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err: any) {
      console.error('Failed to view document:', err)
      setDocumentsError(
        err.response?.data?.message ||
          'Failed to view document.'
      )
    }
  }

  async function handleViewAttachment(
    documentId: string,
    attachmentId: string
  ) {
    if (!c.caseId) {
      return
    }
    try {
      const blob = await viewAttachment(
        c.caseId,
        documentId,
        attachmentId
      )

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')

      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err: any) {
      console.error('Failed to view attachment:', err)
      setDocumentsError(
        err.response?.data?.message ||
          'Failed to view attachment.'
      )
    }
  }

  const tabs = [
    t('tabOverview'),
    t('tabDocuments'),
    t('tabWorkflow'),
    t('tabRemarks'),
  ]

  const isActive =
    c.rawStatus !== 'APPROVED' &&
    c.rawStatus !== 'REJECTED' &&
    c.rawStatus !== 'ARCHIVED' &&
    c.rawStatus !== 'COMPLETED'

  const canAct =
    role !== 'records' && isActive

  // ─────────────────────────────────────────────
  // Assign / Reassign
  // ─────────────────────────────────────────────

  async function openAssign(
    mode: 'assign' | 'reassign'
  ) {
    setAssignMode(mode)
    setSelectedUnitId('')
    setAssignUnitsError('')
    setAssignOpen(true)

    if (!c.currentUnitId) {
      setAssignUnitsError(
        'This case has no current unit on record.'
      )
      return
    }

    setLoadingAssignUnits(true)

    try {
      if (mode === 'reassign') {
        if (!c.returnedFromUnitId) {
          setAssignUnitsError(
            t('noPreviousUnitFound') ||
              'No previous unit found for this case yet.'
          )

          setAssignUnits([])

          return
        }

        const res = await getOrganization(
          c.returnedFromUnitId
        )

        setAssignUnits(
          res.data ? [res.data] : []
        )

        setSelectedUnitId(
          res.data?.unitId ?? ''
        )
      } else {
        const res =
          await getOrganizationChildren(
            c.currentUnitId
          )

        setAssignUnits(
          res.data ?? []
        )
      }
    } catch (err: any) {
      console.error(
        'Failed to load units:',
        err
      )

      setAssignUnitsError(
        err.response?.data?.message ||
          'Failed to load units.'
      )
    } finally {
      setLoadingAssignUnits(false)
    }
  }

  async function confirmAssign() {
    if (!selectedUnitId) return

    setSubmitting(true)
    setActionError('')

    try {
      if (!c.caseId) {
        setAssignUnitsError(
          'Case ID is missing.'
        )
        return
      }

      if (
        assignMode === 'reassign'
      ) {
        await reassignCase(
          c.caseId,
          {
            toUnitId:
              selectedUnitId,
            remarks:
              remarkText.trim() ||
              undefined,
          }
        )
      } else {
        await assignCase(
          c.caseId,
          {
            toUnitId:
              selectedUnitId,
            remarks:
              remarkText.trim() ||
              undefined,
          }
        )
      }

      setAssignOpen(false)
      setRemarkText('')

      onActionComplete?.()
    } catch (err: any) {
      console.error(
        'Assign failed:',
        err
      )

      setActionError(
        err.response?.data?.message ||
          'Failed to assign case.'
      )
    } finally {
      setSubmitting(false)
    }
  }


  // ─────────────────────────────────────────────
// Transfer to another Directorate
// ─────────────────────────────────────────────

async function openTransfer() {
  setSelectedTransferUnitId('')
  setTransferRemark('')
  setTransferUnits([])
  setTransferUnitsError('')
  setTransferOpen(true)

  if (!c.currentUnitId) {
    setTransferUnitsError(
      'This case has no current directorate on record.'
    )
    return
  }

  setLoadingTransferUnits(true)

  try {
    // Get the current directorate so we know its parent Sector.
    const currentDirectorate = await getOrganization(
      c.currentUnitId
    )

    const sectorUnitId =
      currentDirectorate.data?.parentUnitId

    if (!sectorUnitId) {
      setTransferUnitsError(
        'The current directorate is not linked to a sector.'
      )
      return
    }

    // Get all children of the current Sector.
    const childrenResponse =
      await getOrganizationChildren(
        sectorUnitId
      )

    // Keep only active Directorates and exclude
    // the current Directorate.
    const otherDirectorates =
      (childrenResponse.data ?? []).filter(
        (unit: OrganizationUnit) =>
          unit.unitType === 'DIRECTORATE' &&
          unit.isActive &&
          unit.unitId !== c.currentUnitId
      )

    setTransferUnits(otherDirectorates)
  } catch (err: any) {
    console.error(
      'Failed to load directorates for transfer:',
      err
    )

    setTransferUnitsError(
      err.response?.data?.message ||
        'Failed to load directorates.'
    )
  } finally {
    setLoadingTransferUnits(false)
  }
}

async function confirmTransfer() {
  if (!selectedTransferUnitId) return

  if (!c.caseId) {
    setActionError('Case ID is missing.')
    return
  }

  if (!transferRemark.trim()) {
    setActionError('Please enter a remark for the transfer.')
    return
  }

  setSubmitting(true)
  setActionError('')

  try {
    await transferCase(
      c.caseId,
      {
        toUnitId: selectedTransferUnitId,
        remarks: transferRemark.trim(),
      }
    )

    setTransferOpen(false)
    setSelectedTransferUnitId('')
    setTransferRemark('')

    onActionComplete?.()
  } catch (err: any) {
    console.error(
      'Transfer failed:',
      err
    )

    setActionError(
      err.response?.data?.message ||
        'Failed to transfer case.'
    )
  } finally {
    setSubmitting(false)
  }
}
  // ─────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────

  async function confirmReturn() {
    if (!returnReason.trim()) return

    setSubmitting(true)
    setActionError('')

    try {
      if (!c.caseId) {
        setAssignUnitsError(
          'Case ID is missing.'
        )
        return
      }

      await returnCase(
        c.caseId,
        {
          remarks:
            returnReason.trim(),
        }
      )

      setReturnOpen(false)
      setReturnReason('')

      onActionComplete?.()
    } catch (err: any) {
      console.error(
        'Return failed:',
        err
      )

      setActionError(
        err.response?.data?.message ||
          'Failed to return case.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────
  // Approve / Reject
  // ─────────────────────────────────────────────

  async function confirmDecision(
    decisionType:
      | 'APPROVED'
      | 'REJECTED'
  ) {
    if (
      decisionType === 'REJECTED' &&
      !rejectReason.trim()
    ) {
      return
    }

    setSubmitting(true)
    setActionError('')

    try {
      if (!c.caseId) {
        setActionError(
          'Case ID is missing.'
        )
        return
      }

      // 1. Record the decision
      await makeDecision(
        c.caseId,
        {
          decisionType,
          decisionText:
            (
              decisionType === 'REJECTED'
                ? rejectReason
                : workSummary
            ).trim() ||
            undefined,
        }
      )

      /*
       * 2. If Sector approved the case
       *    and selected "Archive after approval",
       *    archive it using the separate
       *    archive endpoint.
       *
       * PATCH /cases/{caseId}/archive
       */
      if (
        decisionType === 'APPROVED' &&
        role === 'sector' &&
        archiveAfterApproval
      ) {
        await toggleCaseArchive(
          c.caseId,
          true
        )
      }

      setApproveOpen(false)
      setRejectOpen(false)
      setWorkSummary('')
      setRejectReason('')
      setArchiveAfterApproval(false)

      onActionComplete?.()
    } catch (err: any) {
      console.error(
        'Decision failed:',
        err
      )

      setActionError(
        err.response?.data?.message ||
          'Failed to submit decision.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">

      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        {t('backToCases')}
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="font-mono text-xs font-bold text-gray-400 mb-1">
              {c.id}
            </p>

            <h1
              className="text-2xl font-black text-gray-900 mb-3"
              style={{
                fontFamily:
                  'var(--font-display)',
              }}
            >
              {c.subject}
            </h1>

            <div className="flex items-center flex-wrap gap-2">

              <StatusBadge
                status={c.status}
              />

              <PriorityBadge
                priority={c.priority}
              />

              <span className="text-xs text-gray-400">
                {t('fieldRegistered')}{' '}
                {c.date}
              </span>

            </div>

          </div>

          
          <div className="flex gap-2 flex-wrap justify-end">
{/* ACTION BUTTONS */}
            {/* SECTOR */}
            {canAct &&
              c.currentUnitType ===
                'SECTOR' && (
                <>

                  <Btn
                    size="sm"
                    variant="success"
                    onClick={() =>
                      setApproveOpen(true)
                    }
                  >
                    ✓ {t('approve')}
                  </Btn>

                  <Btn
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      setRejectOpen(true)
                    }
                  >
                    ✕ {t('reject')}
                  </Btn>

                  <Btn
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setReturnOpen(true)
                    }
                  >
                    ↩ {t('return')}
                  </Btn>

                  <Btn
                    size="sm"
                    onClick={() =>
                      openAssign('assign')
                    }
                  >
                    {t('modal_assignDir')}
                  </Btn>

                  {c.rawStatus ===
                    'SENT_BACK_FOR_CORRECTION' && (
                    <Btn
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        openAssign('reassign')
                      }
                    >
                      ⇄{' '}
                      {t('reassign') ||
                        'Reassign'}
                    </Btn>
                  )}

                </>
              )}

            {/* DIRECTORATE */}
            {canAct &&
              c.currentUnitType ===
                'DIRECTORATE' && (
                <>

                  <Btn
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setReturnOpen(true)
                    }
                  >
                    ↩ {t('return')}
                  </Btn>
                  <Btn
                      size="sm"
                      variant="secondary"
                      onClick={openTransfer}
                    >
                      ⇄ Transfer
                    </Btn>

                  <Btn
                    size="sm"
                    onClick={() =>
                      openAssign('assign')
                    }
                  >
                    {t('modal_assignGroup')}
                  </Btn>

                  {c.rawStatus ===
                    'SENT_BACK_FOR_CORRECTION' && (
                    <Btn
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        openAssign('reassign')
                      }
                    >
                      ⇄{' '}
                      {t('reassign') ||
                        'Reassign'}
                    </Btn>
                  )}

                </>
              )}

            {/* GROUP */}
            {canAct &&
              c.currentUnitType ===
                'GROUP' && (
                <>

                  <Btn
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setReturnOpen(true)
                    }
                  >
                    ↩{' '}
                    {t(
                      'sendToDirectorate'
                    )}
                  </Btn>

                </>
              )}

            {/* ARCHIVE */}
            {role === 'sector' &&
              c.rawStatus ===
                'APPROVED' &&
              !c.isArchived && (
                <Btn
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onArchive?.(true)
                  }
                >
                  🗃 Archive
                </Btn>
              )}

            {/* UNARCHIVE */}
            {role === 'sector' &&
              c.isArchived && (
                <Btn
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onArchive?.(false)
                  }
                >
                  ↩ Unarchive
                </Btn>
              )}

          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">

          <span>📍</span>

          <span>
            {t('currentLocation')}{' '}
            <strong className="text-gray-700">
              {c.sector}
            </strong>
          </span>

        </div>

        {actionError && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
            {actionError}
          </div>
        )}

      </div>

      {/* TABS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

        <TabBar
          tabs={tabs}
          active={tab}
          onChange={setTab}
        />

        <div className="mt-5">

          {/* ─────────────── OVERVIEW ─────────────── */}
          {tab === t('tabOverview') && (
            <div className="space-y-6">
              <Section title={t('col_customer') || 'Customer'}>
                <Row label={t('label_fullName')} val={c.customer} />
                <Row label={t('col_sector')} val={c.sector} />
                <Row label={t('col_status')} val={c.status} />
                <Row label={t('col_priority')} val={c.priority} />
                <Row label={t('fieldRegistered')} val={c.date} />
                <Row label={t('trackingNumber')} val={c.id} mono />
              </Section>
            </div>
          )}

          {/* ─────────────── DOCUMENTS ─────────────── */}
          {tab === t('tabDocuments') && (
            <div className="space-y-4">
              {loadingDocuments ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  Loading documents...
                </div>
              ) : documentsError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {documentsError}
                </div>
              ) : documents.length === 0 ? (
                <EmptyState
                  icon="📄"
                  title="No documents yet"
                />
              ) : (
                documents.map(document => (
                  <div
                    key={document.documentId}
                    className="border border-gray-100 rounded-xl bg-gray-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {document.fileName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {document.title} · {document.documentType}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {document.fileSize} · {new Date(document.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <Btn
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleViewCaseDocument(
                            document.documentId
                          )
                        }
                      >
                        View
                      </Btn>
                    </div>

                    {(attachments[document.documentId]?.length ?? 0) > 0 && (
                      <div className="mt-4 ml-8 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                          Attachments
                        </p>

                        {attachments[document.documentId].map(attachment => (
                          <div
                            key={attachment.attachmentId}
                            className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2"
                          >
                            <span>📎</span>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 truncate">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {attachment.fileSize}
                              </p>
                            </div>

                            <Btn
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                handleViewAttachment(
                                  document.documentId,
                                  attachment.attachmentId
                                )
                              }
                            >
                              View
                            </Btn>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─────────────── WORKFLOW ─────────────── */}
          {tab === t('tabWorkflow') && (
            <div>
              {loadingTabs ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading history...</div>
              ) : tabsError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {tabsError}
                </div>
              ) : history.length === 0 ? (
                <EmptyState icon="🕓" title="No workflow activity yet" />
              ) : (
                <div className="space-y-3">
                  {history.map((entry, i) => (
                    <TimelineRow key={i} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─────────────── REMARKS ─────────────── */}
          {tab === t('tabRemarks') && (
            <div>
              {loadingTabs ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading remarks...</div>
              ) : tabsError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {tabsError}
                </div>
              ) : remarks.length === 0 ? (
                <EmptyState icon="💬" title="No remarks yet" />
              ) : (
                <div className="space-y-4">
                  {remarks.map((r) => (
                    <RemarkBubble key={r.remarkId} remark={r} />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ─────────────────────────────────────── */}
      {/* APPROVE MODAL */}
      {/* ─────────────────────────────────────── */}

      <Modal
        open={approveOpen}
        onClose={() =>
          setApproveOpen(false)
        }
        title={
          role === 'group'
            ? t('modal_completeWork')
            : t('modal_approveCase')
        }
      >

        {role === 'sector' ? (
          <div className="space-y-4">

            <div className="flex items-center gap-3">

              <input
                type="checkbox"
                id="archiveAfterApproval"
                checked={
                  archiveAfterApproval
                }
                onChange={e =>
                  setArchiveAfterApproval(
                    e.target.checked
                  )
                }
                className="w-4 h-4 text-[#1E4B8F] border-gray-300 rounded focus:ring-[#1E4B8F]"
              />

              <label
                htmlFor="archiveAfterApproval"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Archive after approval
              </label>

            </div>

            <Textarea
              label={t('label_optRemark')}
              value={workSummary}
              onChange={e =>
                setWorkSummary(
                  e.target.value
                )
              }
              placeholder={t(
                'ph_closingRemark'
              )}
            />

            <div className="flex gap-3 mt-4">

              <Btn
                variant="secondary"
                onClick={() =>
                  setApproveOpen(false)
                }
                className="flex-1"
                disabled={submitting}
              >
                {t('cancel')}
              </Btn>

              <Btn
                variant="success"
                onClick={() =>
                  confirmDecision(
                    'APPROVED'
                  )
                }
                className="flex-1"
                disabled={submitting}
              >
                {submitting
                  ? '...'
                  : t(
                      'confirmApproval'
                    )}
              </Btn>

            </div>

          </div>
        ) : (
          <>
            <Textarea
              label={
                role === 'group'
                  ? t(
                      'label_workSummary'
                    )
                  : t(
                      'label_optRemark'
                    )
              }
              value={workSummary}
              onChange={e =>
                setWorkSummary(
                  e.target.value
                )
              }
              placeholder={
                role === 'group'
                  ? t(
                      'ph_workSummary'
                    )
                  : t(
                      'ph_closingRemark'
                    )
              }
            />

            <div className="flex gap-3 mt-4">

              <Btn
                variant="secondary"
                onClick={() =>
                  setApproveOpen(false)
                }
                className="flex-1"
                disabled={submitting}
              >
                {t('cancel')}
              </Btn>

              <Btn
                variant="success"
                onClick={() =>
                  confirmDecision(
                    'APPROVED'
                  )
                }
                className="flex-1"
                disabled={submitting}
              >
                {submitting
                  ? '...'
                  : role === 'group'
                    ? t('completeWork')
                    : t(
                        'confirmApproval'
                      )}
              </Btn>

            </div>
          </>
        )}

      </Modal>

      {/* ─────────────────────────────────────── */}
      {/* REJECT MODAL */}
      {/* ─────────────────────────────────────── */}

      <Modal
        open={rejectOpen}
        onClose={() =>
          setRejectOpen(false)
        }
        title={t(
          'modal_rejectCase'
        )}
      >

        <div className="space-y-3">

          <Textarea
            label={t('label_reason')}
            value={rejectReason}
            onChange={e =>
              setRejectReason(
                e.target.value
              )
            }
            placeholder={t(
              'ph_rejectReason'
            )}
          />

          <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
            <span>⚠️</span>
            <span>
              {t('customerVisible')}
            </span>
          </div>

        </div>

        <div className="flex gap-3 mt-4">

          <Btn
            variant="secondary"
            onClick={() =>
              setRejectOpen(false)
            }
            className="flex-1"
            disabled={submitting}
          >
            {t('cancel')}
          </Btn>

          <Btn
            variant="danger"
            disabled={
              !rejectReason.trim() ||
              submitting
            }
            onClick={() =>
              confirmDecision(
                'REJECTED'
              )
            }
            className="flex-1"
          >
            {submitting
              ? '...'
              : t(
                  'confirmRejection'
                )}
          </Btn>

        </div>

      </Modal>

      {/* ─────────────────────────────────────── */}
      {/* ASSIGN / REASSIGN MODAL */}
      {/* ─────────────────────────────────────── */}

      <Modal
        open={assignOpen}
        onClose={() =>
          setAssignOpen(false)
        }
        title={
          assignMode ===
          'reassign'
            ? t('reassign') ||
              'Reassign Case'
            : c.currentUnitType ===
                'DIRECTORATE'
              ? t(
                  'modal_assignGroup'
                )
              : t(
                  'modal_assignDir'
                )
        }
      >

        <p className="text-sm text-gray-600 mb-4">
          Case:{' '}
          <span className="font-mono font-semibold">
            {c.id}
          </span>
        </p>

        {loadingAssignUnits ? (
          <p className="text-sm text-gray-400">
            Loading...
          </p>
        ) : assignUnitsError ? (
          <p className="text-sm text-red-500">
            {assignUnitsError}
          </p>
        ) : assignUnits.length === 0 ? (
          <p className="text-sm text-gray-400">
            No units available.
          </p>
        ) : (
          <div className="space-y-2">

            {assignUnits.map(u => (
              <button
                type="button"
                key={u.unitId}
                onClick={() =>
                  setSelectedUnitId(
                    u.unitId
                  )
                }
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  selectedUnitId ===
                  u.unitId
                    ? 'border-[#1E4B8F] bg-[#EEF4FF] text-[#1E4B8F]'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                }`}
              >
                {u.name}
              </button>
            ))}

          </div>
        )}

        <Textarea
          label={t(
            'label_optInstructions'
          )}
          value={remarkText}
          onChange={e =>
            setRemarkText(
              e.target.value
            )
          }
          placeholder={t(
            'ph_instructions'
          )}
          className="mt-3"
        />

        <div className="flex gap-3 mt-4">

          <Btn
            variant="secondary"
            onClick={() =>
              setAssignOpen(false)
            }
            className="flex-1"
            disabled={submitting}
          >
            {t('cancel')}
          </Btn>

          <Btn
            onClick={confirmAssign}
            className="flex-1"
            disabled={
              !selectedUnitId ||
              submitting
            }
          >
            {submitting
              ? '...'
              : assignMode ===
                  'reassign'
                ? t('reassign') ||
                  'Reassign'
                : t('assign')}
          </Btn>

        </div>

      </Modal>


      {/* ─────────────────────────────────────── */}
{/* TRANSFER MODAL */}
{/* ─────────────────────────────────────── */}

<Modal
  open={transferOpen}
  onClose={() => {
    if (!submitting) {
      setTransferOpen(false)
      setTransferRemark('')
      setSelectedTransferUnitId('')
    }
  }}
  title="Transfer Case"
>
  <p className="text-sm text-gray-600 mb-4">
    Transfer case{' '}
    <span className="font-mono font-semibold">
      {c.id}
    </span>{' '}
    to another Directorate under this Sector.
  </p>

  {/* DESTINATION DIRECTORATE */}
  <div className="space-y-2">

    <p className="text-xs font-bold text-gray-600">
      Destination Directorate *
    </p>

    {loadingTransferUnits ? (
      <p className="text-sm text-gray-400">
        Loading directorates...
      </p>
    ) : transferUnitsError ? (
      <p className="text-sm text-red-500">
        {transferUnitsError}
      </p>
    ) : transferUnits.length === 0 ? (
      <p className="text-sm text-gray-400">
        No other directorates are available under this sector.
      </p>
    ) : (
      <div className="space-y-2">
        {transferUnits.map(unit => (
          <button
            type="button"
            key={unit.unitId}
            onClick={() =>
              setSelectedTransferUnitId(
                unit.unitId
              )
            }
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              selectedTransferUnitId ===
              unit.unitId
                ? 'border-[#1E4B8F] bg-[#EEF4FF] text-[#1E4B8F]'
                : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
            }`}
          >
            {unit.name}
          </button>
        ))}
      </div>
    )}

  </div>

  {/* REMARK */}
  <Textarea
    label="Transfer Remark *"
    value={transferRemark}
    onChange={e =>
      setTransferRemark(
        e.target.value
      )
    }
    placeholder="Enter the reason or instructions for transferring this case..."
    rows={4}
    className="mt-4"
  />

  <div className="flex gap-3 mt-4">

    <Btn
      variant="secondary"
      onClick={() => {
        setTransferOpen(false)
        setTransferRemark('')
        setSelectedTransferUnitId('')
      }}
      className="flex-1"
      disabled={submitting}
    >
      {t('cancel')}
    </Btn>

    <Btn
      onClick={confirmTransfer}
      className="flex-1"
      disabled={
        !selectedTransferUnitId ||
        !transferRemark.trim() ||
        submitting ||
        loadingTransferUnits
      }
    >
      {submitting
        ? 'Transferring...'
        : '⇄ Transfer Case'}
    </Btn>

  </div>
</Modal>

      {/* ─────────────────────────────────────── */}
      {/* RETURN MODAL */}
      {/* ─────────────────────────────────────── */}

      <Modal
        open={returnOpen}
        onClose={() =>
          setReturnOpen(false)
        }
        title={t(
          'modal_returnCase'
        )}
      >

        <p className="text-sm text-gray-600 mb-4">
          Case:{' '}
          <span className="font-mono font-semibold">
            {c.id}
          </span>
        </p>

        <Textarea
          label={t('label_reason')}
          value={returnReason}
          onChange={e =>
            setReturnReason(
              e.target.value
            )
          }
          placeholder={t(
            'ph_returnReason'
          )}
        />

        <div className="flex gap-3 mt-4">

          <Btn
            variant="secondary"
            onClick={() =>
              setReturnOpen(false)
            }
            className="flex-1"
            disabled={submitting}
          >
            {t('cancel')}
          </Btn>

          <Btn
            variant="secondary"
            onClick={confirmReturn}
            disabled={
              !returnReason.trim() ||
              submitting
            }
            className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            {submitting
              ? '...'
              : `↩ ${t('return')}`}
          </Btn>

        </div>

      </Modal>

    </div>
  )
}

// ─────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
        {title}
      </p>

      <div className="space-y-2.5">
        {children}
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────
// Row
// ─────────────────────────────────────────────────────

function Row({
  label,
  val,
  mono = false,
}: {
  label: string
  val: string
  mono?: boolean
}) {
  return (
    <div className="flex gap-3">

      <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">
        {label}
      </span>

      <span
        className={`text-sm text-gray-800 font-medium ${
          mono ? 'font-mono' : ''
        }`}
      >
        {val}
      </span>

    </div>
  )
}

// ─────────────────────────────────────────────────────
// Timeline Row (Workflow tab)
// ─────────────────────────────────────────────────────

function TimelineRow({ entry }: { entry: CaseHistoryEntry }) {
  const icon =
    entry.type === 'ASSIGNMENT' ? '➡️' :
    entry.type === 'DECISION' ? (entry.decisionType === 'APPROVED' ? '✅' : '✕') :
    '🔄'

  const title =
    entry.type === 'ASSIGNMENT'
      ? `${entry.fromUnit ?? 'Unknown unit'} → ${entry.toUnit}`
      : entry.type === 'DECISION'
        ? entry.decisionType === 'APPROVED' ? 'Case Approved' : 'Case Rejected'
        : `Status changed to ${entry.status.replace(/_/g, ' ')}`

  const note =
    entry.type === 'ASSIGNMENT' ? entry.remarks :
    entry.type === 'DECISION' ? entry.decisionText :
    null

  return (
    <div className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
      <div className="text-lg leading-none pt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {note && <p className="text-sm text-gray-600 mt-1">{note}</p>}
        <p className="text-xs text-gray-400 mt-1.5">
          {entry.by.name} · {new Date(entry.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Remark Bubble (Remarks tab — chat-style)
// ─────────────────────────────────────────────────────

function RemarkBubble({ remark }: { remark: CaseRemarkItem }) {
  const initials = remark.by.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-[#1E4B8F] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block max-w-full">
          <p className="text-sm text-gray-800">{remark.remarkText}</p>
        </div>
        <p className="text-xs text-gray-400 mt-1 px-1">
          {remark.by.name} · {new Date(remark.createdAt).toLocaleString()}
          {remark.context && ` · ${remark.context}`}
        </p>
      </div>
    </div>
  )
}
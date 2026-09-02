import { useState, useEffect } from 'react'
import { getCases, type CaseItem } from '../api/cases.api'
import { formatCaseStatus, mapCaseToRecord } from '../utils/caseMappers'

import { assignCase, makeDecision, reassignCase, returnCase } from '../api/workflow.api'
import {
  createCase,
  uploadDocument,
  uploadAttachment,
} from '../api/cases.api'

import { getOrganization, getOrganizationChildren, getOrganizations, type OrganizationUnit } from '../api/organizations.api'


import {
  StatusBadge,
  KpiCard,
  Btn,
  Modal,
  Input,
  Textarea,
  Select,
  TabBar,
  CaseTimeline,
  EmptyState,
  PriorityBadge,
} from '../components/ui'

import type { CaseRecord } from '../types'
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

  function openCase(c: CaseRecord) {
    setSelectedCase(c)
    setPage('case-detail')
    setCaseTab('Overview')
  }

  if (page === 'register') {
    return <RegisterCaseForm onSuccess={() => setPage('cases')} />
  }

  if (page === 'case-detail' && selectedCase) {
    return (
      <CaseDetail
        c={selectedCase}
        tab={caseTab}
        setTab={setCaseTab}
        onBack={() => setPage('cases')}
        role="records"
        onActionComplete={() => { loadCases(); setPage('cases') }}
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
            
          : page === 'returned' // Added this
            ? c.status === 'Returned'
            : true
      ) &&
      (
        c.subject.toLowerCase().includes(searchQ.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQ.toLowerCase()) ||
        c.customer.toLowerCase().includes(searchQ.toLowerCase())
      )
  )
 // Then add a new section for 'returned' page (after the archive section, around line 228):
// ─────────────────────────────────────────────
// Returned
// ─────────────────────────────────────────────

if (page === 'returned') {
  const returnedCases = cases.map(mapCaseToRecord).filter(
    c => c.status === 'Returned'
  )

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

        <div className="grid gap-4">
        {cases.map(mapCaseToRecord).flatMap(c =>
            c.documents.map(d => ({
              ...d,
              caseId: c.id,
              subject: c.subject,
            }))
          ).map((d, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">
                📄
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {d.name}
                </p>

                <p className="text-xs text-gray-400">
                  Version {d.version} · {d.size} · {d.date} · {d.caseId}
                </p>
              </div>

              <Btn variant="secondary" size="sm">
                View
              </Btn>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Archive
  // ─────────────────────────────────────────────

  if (page === 'archive') {
    const archivedCases = cases.map(mapCaseToRecord).filter(
      c =>
        c.status === 'Archived' ||
        c.status === 'Approved' ||
        c.status === 'Rejected'
    )

    return (
      <div className="p-6">
        <h2
          className="text-xl font-black text-gray-900 mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('archive')}
        </h2>

        <CasesTable
          cases={archivedCases}
          onOpen={openCase}
        />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Dashboard
  // ─────────────────────────────────────────────

  if (page === 'dashboard') {
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
            value={5}
            icon="📋"
            sub="Aug 15, 2026"
          />

          <KpiCard
            label={t('kpi_totalActive')}
            value={18}
            icon="🔄"
            accent="#2563EB"
          />

          <KpiCard
            label={t('kpi_archivedCases')}
            value={2}
            icon="🗃"
            accent="#6B7280"
          />

          <KpiCard
            label={t('kpi_pendingUpload')}
            value={3}
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
            cases={cases.map(mapCaseToRecord).slice(0, 5)}
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
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search…"
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20"
          />

          <Btn onClick={() => setPage('register')}>
            ➕ {t('registerCase')}
          </Btn>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <CasesTable
          cases={myCases}
          onOpen={openCase}
        />
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

// ─────────────────────────────────────────────────────
// Register Case Form
// ─────────────────────────────────────────────────────

function RegisterCaseForm({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const { t } = useLanguage()

  const [step, setStep] = useState<1 | 2 | 3 | 'done'>(1)

  const [sector, setSector] = useState('')

  
  // ── NEW: live sectors from the backend ──
  const [sectors, setSectors] = useState<OrganizationUnit[]>([])
  const [loadingSectors, setLoadingSectors] = useState(false)
  const [sectorsError, setSectorsError] = useState('')

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
        console.error('Failed to load sectors:', err)
        setSectorsError(
          err.response?.data?.message || 'Failed to load sectors.'
        )
      } finally {
        setLoadingSectors(false)
      }
    }

    loadSectors()
  }, [])


  // The state stores the ORGANIZATIONAL UNIT ID.
  // Never change this to the sector name.
 
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

  const [error, setError] =
    useState('')

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
    priority: 'Normal',
    notes: '',
  })

  // Convert sector ID → sector object.
  // This is only for DISPLAY.
  const selectedSector = sectors.find(s => s.unitId === sector)

  function update(k: string, v: string) {
    setFormData(f => ({
      ...f,
      [k]: v,
    }))
  }

  // ─────────────────────────────────────────────
  // Reset form
  // ─────────────────────────────────────────────

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
      priority: 'Normal',
      notes: '',
    })
  }

  // ─────────────────────────────────────────────
  // Register case
  // ─────────────────────────────────────────────

  async function handleRegisterCase() {
    setError('')

    if (!formData.name.trim()) {
      setError('Please enter the customer name.')
      setStep(1)
      return
    }

    if (!formData.phone.trim()) {
      setError('Please enter the customer phone number.')
      setStep(1)
      return
    }

    if (!formData.subject.trim()) {
      setError('Please enter the case subject.')
      setStep(2)
      return
    }

    if (!formData.reference.trim()) {
      setError('Please enter the incoming reference number.')
      setStep(2)
      return
    }

    if (!mainDocument) {
      setError('Please upload the main document.')
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

    if (!sector) {
      setError('Please select a sector.')
      return
    }

    setIsSubmitting(true)

    let createdCaseId: string | null = null
    let createdDocumentId: string | null = null

    try {
      // ====================================================
      // 1. CREATE CASE
      // ====================================================

      const caseResponse = await createCase({
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          address: formData.address.trim() || undefined,
        },

        incomingReferenceNo:
          formData.reference.trim(),

        subject:
          formData.subject.trim(),
      })

      createdCaseId = caseResponse.data.caseId

      const trackingNumber =
        caseResponse.data.trackingNumber

      // ====================================================
      // 2. UPLOAD MAIN DOCUMENT
      // ====================================================

      const documentResponse =
        await uploadDocument(
          createdCaseId,
          mainDocument,
          documentType,
          documentTitle.trim()
        )

      createdDocumentId =
        documentResponse.data.documentId

      // ====================================================
      // 3. UPLOAD OPTIONAL ATTACHMENTS
      // ====================================================

      for (const attachment of attachments) {
        await uploadAttachment(
          createdCaseId,
          createdDocumentId,
          attachment
        )
      }

      // ====================================================
      // 4. ASSIGN CASE TO SELECTED SECTOR
      // ====================================================
      //
      // IMPORTANT:
      // sector contains the organizational unit ID.
      //
      // We send the ID to the backend.
      // We NEVER send the displayed sector name here.
      //
      // Example:
      //
      // UI:
      // Housing Development Sector
      //
      // API:
      // toUnitId: "uuid-of-housing-development-sector"
      //
      // ====================================================

      await assignCase(createdCaseId, {
        toUnitId: sector,
        remarks:
          formData.notes.trim() || undefined,
      })

      // ====================================================
      // 5. SUCCESS
      // ====================================================

      if (!createdDocumentId) {
        throw new Error('Main document was not created.')
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

      // Case was created but document failed
      if (
        createdCaseId &&
        !createdDocumentId
      ) {
        setError(
          `Case ${createdCaseId} was created, but the main document could not be uploaded. Please do not register the case again.`
        )
      }

      // Case and document were created but assignment failed
      else if (
        createdCaseId &&
        createdDocumentId
      ) {
        setError(
          `The case and document were created, but the case could not be sent to the selected sector. Please do not register the case again.`
        )
      }

      // Case wasn't created
      else {
        setError(
          err?.response?.data?.message ||
          'Unable to register the case. Please check the information and try again.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────
  // Registration successful
  // ─────────────────────────────────────────────

  if (step === 'done') {
    return (
      <div className="p-6 flex justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
            ✅
          </div>

          <h2
            className="text-xl font-black text-gray-900 mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
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

            {/* IMPORTANT:
                Display sector NAME, not sector ID.
            */}
            <p className="text-xs text-gray-500 mt-2">
              {t('assignedTo')}{' '}
              <span className="font-semibold text-gray-700">
                {selectedSector?.name ?? 'Selected Sector'}
              </span>
            </p>
          </div>

          <div className="flex gap-3">

            <Btn
              onClick={resetForm}
              variant="secondary"
              className="flex-1"
            >
              {t('registerAnother')}
            </Btn>

            <Btn
              onClick={onSuccess}
              className="flex-1"
            >
              {t('viewCases')}
            </Btn>

          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Registration form
  // ─────────────────────────────────────────────

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">

        <button
          onClick={onSuccess}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ←
        </button>

        <h2
          className="text-xl font-black text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('registerNewCaseTitle')}
        </h2>

      </div>

      {/* Error */}
      {error && (
        <div className="max-w-xl mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-start gap-2">
            <span>⚠️</span>

            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Steps */}
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

        {/* =================================================
            STEP 1 — CUSTOMER
        ================================================= */}

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

            <h3 className="font-bold text-gray-800 mb-2">
              {t('customerInformation')}
            </h3>

            <Input
              label={t('label_fullName')}
              value={formData.name}
              onChange={e =>
                update('name', e.target.value)
              }
              placeholder={t('ph_name')}
            />

            <Input
              label={t('label_phone')}
              value={formData.phone}
              onChange={e =>
                update('phone', e.target.value)
              }
              placeholder={t('ph_phone')}
            />

            <Input
              label={t('label_email')}
              value={formData.email}
              onChange={e =>
                update('email', e.target.value)
              }
              placeholder={t('ph_email')}
              type="email"
            />

            <Textarea
              label={t('label_address')}
              value={formData.address}
              onChange={e =>
                update('address', e.target.value)
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

        {/* =================================================
            STEP 2 — CASE DETAILS
        ================================================= */}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

            <h3 className="font-bold text-gray-800 mb-2">
              {t('caseInformation')}
            </h3>

            <Input
              label={t('label_subject')}
              value={formData.subject}
              onChange={e =>
                update('subject', e.target.value)
              }
              placeholder={t('ph_subject')}
            />

            <Input
              label={t('label_incomingRef')}
              value={formData.reference}
              onChange={e =>
                update('reference', e.target.value)
              }
              placeholder={t('ph_ref')}
            />

            <Select
              label={t('label_priority')}
              value={formData.priority}
              onChange={e =>
                update('priority', e.target.value)
              }
              options={[
                {
                  value: 'High',
                  label: t('priority_High'),
                },
                {
                  value: 'Normal',
                  label: t('priority_Normal'),
                },
                {
                  value: 'Low',
                  label: t('priority_Low'),
                },
              ]}
            />

            <Textarea
              label={t('label_notes')}
              value={formData.notes}
              onChange={e =>
                update('notes', e.target.value)
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

        {/* =================================================
            STEP 3 — DOCUMENTS + SECTOR
        ================================================= */}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

            <h3 className="font-bold text-gray-800 mb-2">
              {t('step_docsSector')}
            </h3>

            {/* ---------------------------------------------
                DOCUMENT TITLE
            --------------------------------------------- */}

            <Input
              label="Document Title"
              value={documentTitle}
              onChange={e =>
                setDocumentTitle(e.target.value)
              }
              placeholder="Enter document title"
            />

            {/* ---------------------------------------------
                DOCUMENT TYPE
            --------------------------------------------- */}

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

            {/* ---------------------------------------------
                MAIN DOCUMENT
            --------------------------------------------- */}

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
                      e.target.files?.[0] || null

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

            {/* ---------------------------------------------
                ATTACHMENTS
            --------------------------------------------- */}

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
                    const files = Array.from(
                      e.target.files || []
                    )

                    setAttachments(prev => [
                      ...prev,
                      ...files,
                    ])

                    // Reset input so the same file
                    // can be selected again if needed.
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

              {/* Selected attachments */}
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

            {/* ---------------------------------------------
                SELECT SECTOR
            --------------------------------------------- */}

          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">
              {t('label_selectSector')} *
            </p>

            {loadingSectors ? (
              <p className="text-sm text-gray-400">Loading sectors...</p>
            ) : sectorsError ? (
              <p className="text-sm text-red-500">{sectorsError}</p>
            ) : sectors.length === 0 ? (
              <p className="text-sm text-gray-400">No active sectors available.</p>
            ) : (
              <div className="space-y-2">
                {sectors.map(s => (
                  <button
                    type="button"
                    key={s.unitId}
                    onClick={() => {
                      setSector(s.unitId)
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
                <p className="text-xs text-gray-500">Selected sector</p>
                <p className="text-sm font-semibold text-[#1E4B8F]">
                  {selectedSector.name}
                </p>
              </div>
            )}
          </div>

                      {/* ---------------------------------------------
                          BUTTONS
                      --------------------------------------------- */}

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
}: {
  c: CaseRecord
  tab: string
  setTab: (t: string) => void
  onBack: () => void
  role: string
  onActionComplete?: () => void
}) {
  const { t } = useLanguage()

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignMode, setAssignMode] = useState<'assign' | 'reassign'>('assign')
  const [assignUnits, setAssignUnits] = useState<OrganizationUnit[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [loadingAssignUnits, setLoadingAssignUnits] = useState(false)
  const [assignUnitsError, setAssignUnitsError] = useState('')

  const [remarkText, setRemarkText] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [workSummary, setWorkSummary] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')

  const tabs = [t('tabOverview'), t('tabDocuments'), t('tabWorkflow'), t('tabRemarks')]

  const isActive =
    c.rawStatus !== 'APPROVED' &&
    c.rawStatus !== 'REJECTED' &&
    c.rawStatus !== 'ARCHIVED' &&
    c.rawStatus !== 'COMPLETED'

  // Records portal is view/registration only — no workflow actions there.
  const canAct = role !== 'records' && isActive

  // ── Assign / Reassign ──
  async function openAssign(mode: 'assign' | 'reassign') {
    setAssignMode(mode)
    setSelectedUnitId('')
    setAssignUnitsError('')
    setAssignOpen(true)

    if (!c.currentUnitId) {
      setAssignUnitsError('This case has no current unit on record.')
      return
    }

    setLoadingAssignUnits(true)
    try {
      if (mode === 'reassign') {
        if (!c.returnedFromUnitId) {
          setAssignUnitsError(t('noPreviousUnitFound') || 'No previous unit found for this case yet.')
          setAssignUnits([])
          return
        }
        const res = await getOrganization(c.returnedFromUnitId)
        setAssignUnits(res.data ? [res.data] : [])
        setSelectedUnitId(res.data?.unitId ?? '')
      } else {
        const res = await getOrganizationChildren(c.currentUnitId)
        setAssignUnits(res.data ?? [])
      }
    } catch (err: any) {
      console.error('Failed to load units:', err)
      setAssignUnitsError(err.response?.data?.message || 'Failed to load units.')
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
        setAssignUnitsError('Case ID is missing.')
        return
      }
      if (assignMode === 'reassign') {
        await reassignCase(c.caseId, { toUnitId: selectedUnitId, remarks: remarkText.trim() || undefined })
      } else {
        await assignCase(c.caseId, { toUnitId: selectedUnitId, remarks: remarkText.trim() || undefined })
      }
      setAssignOpen(false)
      setRemarkText('')
      onActionComplete?.()
    } catch (err: any) {
      console.error('Assign failed:', err)
      setActionError(err.response?.data?.message || 'Failed to assign case.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Return (auto-goes back to previous unit — no picker) ──
  async function confirmReturn() {
    if (!returnReason.trim()) return
    setSubmitting(true)
    setActionError('')
    try {
      if (!c.caseId) {
        setAssignUnitsError('Case ID is missing.')
        return
      }
      await returnCase(c.caseId, { remarks: returnReason.trim() })
      setReturnOpen(false)
      setReturnReason('')
      onActionComplete?.()
    } catch (err: any) {
      console.error('Return failed:', err)
      setActionError(err.response?.data?.message || 'Failed to return case.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Approve / Reject ──
  async function confirmDecision(decisionType: 'APPROVED' | 'REJECTED') {
    if (decisionType === 'REJECTED' && !rejectReason.trim()) return
    setSubmitting(true)
    setActionError('')
    try {
      if (!c.caseId) {
        setAssignUnitsError('Case ID is missing.')
        return
      }
      await makeDecision(c.caseId, {
        decisionType,
        decisionText: (decisionType === 'REJECTED' ? rejectReason : workSummary).trim() || undefined,
      })
      setApproveOpen(false)
      setRejectOpen(false)
      setWorkSummary('')
      setRejectReason('')
      onActionComplete?.()
    } catch (err: any) {
      console.error('Decision failed:', err)
      setActionError(err.response?.data?.message || 'Failed to submit decision.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        {t('backToCases')}
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold text-gray-400 mb-1">{c.id}</p>
            <h1 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              {c.subject}
            </h1>
            <div className="flex items-center flex-wrap gap-2">
              <StatusBadge status={c.status} />
              <PriorityBadge priority={c.priority} />
              <span className="text-xs text-gray-400">{t('fieldRegistered')} {c.date}</span>
            </div>
          </div>

          {/* Buttons are gated by where the case currently sits (c.currentUnitType), not who's viewing it */}
          <div className="flex gap-2 flex-wrap justify-end">
            {canAct && c.currentUnitType === 'SECTOR' && (
              <>
                <Btn size="sm" variant="success" onClick={() => setApproveOpen(true)}>✓ {t('approve')}</Btn>
                <Btn size="sm" variant="danger" onClick={() => setRejectOpen(true)}>✕ {t('reject')}</Btn>
                <Btn size="sm" variant="secondary" onClick={() => setReturnOpen(true)}>↩ {t('return')}</Btn>
                <Btn size="sm" onClick={() => openAssign('assign')}>{t('modal_assignDir')}</Btn>
                {c.rawStatus === 'SENT_BACK_FOR_CORRECTION' && (
                  <Btn size="sm" variant="secondary" onClick={() => openAssign('reassign')}>⇄ {t('reassign') || 'Reassign'}</Btn>
                )}
              </>
            )}

            {canAct && c.currentUnitType === 'DIRECTORATE' && (
              <>
                <Btn size="sm" variant="success" onClick={() => setApproveOpen(true)}>✓ {t('approve')}</Btn>
                <Btn size="sm" variant="danger" onClick={() => setRejectOpen(true)}>✕ {t('reject')}</Btn>
                <Btn size="sm" variant="secondary" onClick={() => setReturnOpen(true)}>↩ {t('return')}</Btn>
                <Btn size="sm" onClick={() => openAssign('assign')}>{t('modal_assignGroup')}</Btn>
                {c.rawStatus === 'SENT_BACK_FOR_CORRECTION' && (
                  <Btn size="sm" variant="secondary" onClick={() => openAssign('reassign')}>⇄ {t('reassign') || 'Reassign'}</Btn>
                )}
              </>
            )}

            {canAct && c.currentUnitType === 'GROUP' && (
              <>
                {/*<Btn size="sm" variant="success" onClick={() => setApproveOpen(true)}>✓ {t('completeWork')}</Btn>*/}
                <Btn size="sm" variant="secondary" onClick={() => setReturnOpen(true)}>↩ {t('sendToDirectorate')}</Btn>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <span>📍</span>
          <span>
            {t('currentLocation')}{' '}
            <strong className="text-gray-700">{c.sector}</strong>
          </span>
        </div>

        {actionError && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">{actionError}</div>
        )}
      </div>

      {/* ── Tabs section (Overview / Documents / Workflow / Remarks) — unchanged from your original ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        {/* ...keep everything you already have here... */}
      </div>

      {/* APPROVE MODAL */}
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title={role === 'group' ? t('modal_completeWork') : t('modal_approveCase')}>
        <Textarea
          label={role === 'group' ? t('label_workSummary') : t('label_optRemark')}
          value={workSummary}
          onChange={e => setWorkSummary(e.target.value)}
          placeholder={role === 'group' ? t('ph_workSummary') : t('ph_closingRemark')}
        />
        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" onClick={() => setApproveOpen(false)} className="flex-1" disabled={submitting}>{t('cancel')}</Btn>
          <Btn variant="success" onClick={() => confirmDecision('APPROVED')} className="flex-1" disabled={submitting}>
            {submitting ? '...' : role === 'group' ? t('completeWork') : t('confirmApproval')}
          </Btn>
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={t('modal_rejectCase')}>
        <div className="space-y-3">
          <Textarea label={t('label_reason')} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={t('ph_rejectReason')} />
          <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
            <span>⚠️</span><span>{t('customerVisible')}</span>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" onClick={() => setRejectOpen(false)} className="flex-1" disabled={submitting}>{t('cancel')}</Btn>
          <Btn variant="danger" disabled={!rejectReason.trim() || submitting} onClick={() => confirmDecision('REJECTED')} className="flex-1">
            {submitting ? '...' : t('confirmRejection')}
          </Btn>
        </div>
      </Modal>

      {/* ASSIGN / REASSIGN MODAL (shared) */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={
          assignMode === 'reassign'
            ? (t('reassign') || 'Reassign Case')
            : c.currentUnitType === 'DIRECTORATE' ? t('modal_assignGroup') : t('modal_assignDir')
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Case: <span className="font-mono font-semibold">{c.id}</span>
        </p>

        {loadingAssignUnits ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : assignUnitsError ? (
          <p className="text-sm text-red-500">{assignUnitsError}</p>
        ) : assignUnits.length === 0 ? (
          <p className="text-sm text-gray-400">No units available.</p>
        ) : (
          <div className="space-y-2">
            {assignUnits.map(u => (
              <button
                type="button"
                key={u.unitId}
                onClick={() => setSelectedUnitId(u.unitId)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  selectedUnitId === u.unitId
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
          label={t('label_optInstructions')}
          value={remarkText}
          onChange={e => setRemarkText(e.target.value)}
          placeholder={t('ph_instructions')}
          className="mt-3"
        />

        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" onClick={() => setAssignOpen(false)} className="flex-1" disabled={submitting}>{t('cancel')}</Btn>
          <Btn onClick={confirmAssign} className="flex-1" disabled={!selectedUnitId || submitting}>
            {submitting ? '...' : assignMode === 'reassign' ? (t('reassign') || 'Reassign') : t('assign')}
          </Btn>
        </div>
      </Modal>

      {/* RETURN MODAL */}
      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title={t('modal_returnCase')}>
        <p className="text-sm text-gray-600 mb-4">
          Case: <span className="font-mono font-semibold">{c.id}</span>
        </p>
        <Textarea label={t('label_reason')} value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder={t('ph_returnReason')} />
        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" onClick={() => setReturnOpen(false)} className="flex-1" disabled={submitting}>{t('cancel')}</Btn>
          <Btn
            variant="secondary"
            onClick={confirmReturn}
            disabled={!returnReason.trim() || submitting}
            className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            {submitting ? '...' : `↩ ${t('return')}`}
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
// Document Row
// ─────────────────────────────────────────────────────

function DocRow({
  doc,
}: {
  doc: {
    name: string
    size: string
    date: string
    version: number
  }
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors">

      <span className="text-xl">
        📄
      </span>

      <div className="flex-1 min-w-0">

        <p className="text-sm font-semibold text-gray-900 truncate">
          {doc.name}
        </p>

        <p className="text-xs text-gray-400">
          Version {doc.version} · {doc.size} · {doc.date}
        </p>

      </div>

      <Btn
        variant="secondary"
        size="sm"
      >
        View
      </Btn>

    </div>
  )
}
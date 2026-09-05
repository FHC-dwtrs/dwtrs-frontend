import { useState, useEffect } from 'react'
import {
  StatusBadge,
  KpiCard,
  Btn,
  BarChart,
  EmptyState,
} from '../components/ui'
import { CaseDetail } from './RecordsPage'
import type { CaseRecord } from '../types'
import { useLanguage } from '../i18n'
import {
  getOrganizations,
  type OrganizationUnit,
} from '../api/organizations.api'
import {
  formatCaseStatus,
  mapCaseToRecord,
} from '../utils/caseMappers'
import {
  getAllAuditLogs,
  type AuditLog,
} from '../api/audit.api'
import {
  getCases,
  toggleCaseArchive,
  type CaseItem,
} from '../api/cases.api'
import {
  getPreviouslyHandledCases,
  type PreviouslyHandledCaseItem,
} from '../api/workflow.api'

interface Props {
  page: string
  setPage: (p: string) => void
  sectorName: string
  sectorUnitId: string
}

// ── Directorate with case counts ──
interface DirectorateWithStats extends OrganizationUnit {
  activeCount: number
  pendingDecisionCount: number
  delayedCount: number
}

// ── A single transfer event, ready to render ──
interface TransferEvent {
  auditLogId: string
  trackingNumber: string
  fromUnitName: string
  toUnitName: string
  remarks: string | null
  byName: string
  createdAt: string
}

export default function SectorPage({
  page,
  setPage,
  sectorName,
  sectorUnitId,
}: Props) {
  const { t } = useLanguage()

  const [selectedCase, setSelectedCase] =
    useState<CaseRecord | null>(null)

  const [caseTab, setCaseTab] = useState('Overview')

  const [viewOnly, setViewOnly] = useState(false)

  const [filterStatus, setFilterStatus] = useState('ALL')

  const [searchQ, setSearchQ] = useState('')

  // ── Cases belonging to the current sector ──
  const [allCases, setAllCases] =
    useState<CaseItem[]>([])

  const [loadingCases, setLoadingCases] =
    useState(true)

  const [casesError, setCasesError] =
    useState('')

  // ── Previously handled cases ──
  // Used for viewing cases that the Sector
  // previously forwarded to its Directorates.
  const [previouslyHandled, setPreviouslyHandled] =
    useState<PreviouslyHandledCaseItem[]>([])

  const [loadingDirectorateCases, setLoadingDirectorateCases] =
    useState(false)

  const [directorateCasesError, setDirectorateCasesError] =
    useState('')

  const [archiveError, setArchiveError] =
    useState('')

  // ── Directorates under this Sector ──
  const [directorates, setDirectorates] =
    useState<DirectorateWithStats[]>([])

  const [loadingDirectorates, setLoadingDirectorates] =
    useState(true)

  const [selectedDirectorateId, setSelectedDirectorateId] =
    useState<string | null>(null)

  // ── Transfer history ──
  const [transfers, setTransfers] =
    useState<TransferEvent[]>([])

  const [loadingTransfers, setLoadingTransfers] =
    useState(false)

  const [transfersError, setTransfersError] =
    useState('')

  // ============================================================
  // LOAD SECTOR CASES
  // ============================================================

  async function loadCases() {
    try {
      setLoadingCases(true)
      setCasesError('')

      const result = await getCases()

      setAllCases(result.data ?? [])
    } catch (err: any) {
      console.error('Failed to load cases:', err)

      setCasesError(
        err.response?.data?.message ||
          'Failed to load cases.'
      )
    } finally {
      setLoadingCases(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  // ============================================================
  // LOAD PREVIOUSLY HANDLED CASES
  // Used when viewing a specific Directorate
  // ============================================================

  useEffect(() => {
    if (page !== 'directorate-cases') return

    let cancelled = false

    async function loadPreviouslyHandled() {
      try {
        setLoadingDirectorateCases(true)
        setDirectorateCasesError('')

        const result =
          await getPreviouslyHandledCases()

        if (!cancelled) {
          setPreviouslyHandled(
            result.data?.cases ?? []
          )
        }
      } catch (err: any) {
        if (cancelled) return

        console.error(
          'Failed to load previously handled cases:',
          err
        )

        setDirectorateCasesError(
          err.response?.data?.message ||
            'Failed to load cases for this directorate.'
        )
      } finally {
        if (!cancelled) {
          setLoadingDirectorateCases(false)
        }
      }
    }

    loadPreviouslyHandled()

    return () => {
      cancelled = true
    }
  }, [page])

  // ============================================================
  // ARCHIVE
  // ============================================================

  async function handleArchive(
    caseId: string,
    archived: boolean
  ) {
    try {
      setArchiveError('')

      await toggleCaseArchive(
        caseId,
        archived
      )

      await loadCases()

      setSelectedCase(null)
      setViewOnly(false)

      setPage(
        archived
          ? 'archived'
          : 'cases'
      )
    } catch (err: any) {
      console.error(
        'Failed to update archive status:',
        err
      )

      setArchiveError(
        err.response?.data?.message ||
          'Failed to update case archive status.'
      )
    }
  }

  // ============================================================
  // LOAD DIRECTORATES
  // ============================================================

  useEffect(() => {
    async function loadDirectorates() {
      try {
        setLoadingDirectorates(true)

        const result =
          await getOrganizations({
            unitType: 'DIRECTORATE',
            isActive: true,
          })

        const all = result.data ?? []

        // Only directorates belonging to this Sector
        const sectorDirectorates =
          all.filter(
            (d: any) =>
              d.parentUnitId === sectorUnitId
          )

        // Calculate stats from the cases returned by GET /cases.
        // These are kept separate from the read-only
        // previously-handled Directorate view.
        const directoratesWithStats =
          sectorDirectorates.map(
            (d: OrganizationUnit) => {
              const directorateCases =
                allCases.filter(
                  c =>
                    c.currentUnit?.unitId ===
                    d.unitId
                )

              const activeCount =
                directorateCases.filter(
                  c =>
                    c.status === 'SUBMITTED' ||
                    c.status === 'UNDER_REVIEW' ||
                    c.status === 'IN_PROGRESS' ||
                    c.status ===
                      'PENDING_CLARIFICATION'
                ).length

              const pendingDecisionCount =
                directorateCases.filter(
                  c =>
                    c.status ===
                    'UNDER_REVIEW'
                ).length

              const delayedCount =
                directorateCases.filter(c => {
                  const submittedDate =
                    new Date(
                      c.submittedAt
                    )

                  const now = new Date()

                  const diffTime =
                    Math.abs(
                      now.getTime() -
                        submittedDate.getTime()
                    )

                  const diffDays =
                    Math.ceil(
                      diffTime /
                        (1000 *
                          60 *
                          60 *
                          24)
                    )

                  return (
                    diffDays > 7 &&
                    c.status !== 'APPROVED' &&
                    c.status !== 'REJECTED' &&
                    c.status !== 'ARCHIVED'
                  )
                }).length

              return {
                ...d,
                activeCount,
                pendingDecisionCount,
                delayedCount,
              }
            }
          )

        setDirectorates(
          directoratesWithStats
        )
      } catch (err) {
        console.error(
          'Failed to load directorates:',
          err
        )
      } finally {
        setLoadingDirectorates(false)
      }
    }

    if (sectorUnitId) {
      loadDirectorates()
    }
  }, [sectorUnitId, allCases])

  // ============================================================
  // LOAD TRANSFER HISTORY
  // ============================================================

  useEffect(() => {
    if (page !== 'transferred') return

    if (directorates.length === 0) return

    let cancelled = false

    async function loadTransfers() {
      try {
        setLoadingTransfers(true)
        setTransfersError('')

        const logs =
          await getAllAuditLogs()

        const nameById = new Map(
          directorates.map(d => [
            d.unitId,
            d.name,
          ])
        )

        const relevant: TransferEvent[] =
          logs
            .filter(
              (log: AuditLog) =>
                log.action ===
                'CASE_TRANSFERRED'
            )
            .filter(
              (log: AuditLog) => {
                const fromId =
                  log.oldValues
                    ?.currentUnitId as
                    | string
                    | undefined

                const toId =
                  log.newValues
                    ?.currentUnitId as
                    | string
                    | undefined

                return (
                  (fromId &&
                    nameById.has(fromId)) ||
                  (toId &&
                    nameById.has(toId))
                )
              }
            )
            .map(
              (
                log: AuditLog
              ) => {
                const fromId =
                  log.oldValues
                    ?.currentUnitId as
                    | string
                    | undefined

                const toId =
                  log.newValues
                    ?.currentUnitId as
                    | string
                    | undefined

                return {
                  auditLogId:
                    log.auditLogId,

                  trackingNumber:
                    log.case
                      ?.trackingNumber ??
                    '—',

                  fromUnitName:
                    (fromId &&
                      nameById.get(
                        fromId
                      )) ??
                    'Unknown directorate',

                  toUnitName:
                    (toId &&
                      nameById.get(
                        toId
                      )) ??
                    'Unknown directorate',

                  remarks:
                    (log.newValues
                      ?.remarks as
                      | string
                      | undefined) ??
                    null,

                  byName:
                    log.user?.name ??
                    'Unknown user',

                  createdAt:
                    log.createdAt,
                }
              }
            )

        if (!cancelled) {
          setTransfers(relevant)
        }
      } catch (err: any) {
        if (cancelled) return

        console.error(
          'Failed to load transfer history:',
          err
        )

        setTransfersError(
          err.response?.data?.message ||
            'Failed to load transfer history.'
        )
      } finally {
        if (!cancelled) {
          setLoadingTransfers(false)
        }
      }
    }

    loadTransfers()

    return () => {
      cancelled = true
    }
  }, [page, directorates])

  // ============================================================
  // CASE DATA
  // ============================================================

  // Cases currently sitting directly at THIS sector
  const myCases = allCases.filter(
    c =>
      c.currentUnit?.unitId ===
      sectorUnitId
  )

  // Cases previously handled by this Sector
  // that are now currently sitting at the
  // selected Directorate.
  const selectedDirectorateCases =
    previouslyHandled
      .filter(
        item =>
          item.case.currentUnit?.unitId ===
          selectedDirectorateId
      )
      .map(item => item.case)

  const awaitingDecision =
    myCases.filter(
      c =>
        c.status === 'UNDER_REVIEW'
    )

  const approvedCases =
    myCases.filter(
      c =>
        c.status === 'APPROVED'
    )

  const rejectedCases =
    myCases.filter(
      c =>
        c.status === 'REJECTED'
    )

  const archivedCases =
    myCases.filter(
      c => c.isArchived
    )

  // ============================================================
  // SELECTED DIRECTORATE
  // ============================================================

  const selectedDirectorate =
    directorates.find(
      d =>
        d.unitId ===
        selectedDirectorateId
    )

  // ============================================================
  // OPEN CASE
  // ============================================================

  function openCase(
    c: CaseRecord,
    readOnly = false
  ) {
    setSelectedCase(c)
    setViewOnly(readOnly)
    setPage('case-detail')
    setCaseTab('Overview')
  }

  // ============================================================
  // OPEN DIRECTORATE CASES
  // ============================================================

  function openDirectorateCases(
    unitId: string
  ) {
    setSelectedDirectorateId(unitId)
    setPage('directorate-cases')
  }

  // ============================================================
  // CASE DETAIL
  // ============================================================

  if (
    page === 'case-detail' &&
    selectedCase
  ) {
    return (
      <CaseDetail
        c={selectedCase}
        tab={caseTab}
        setTab={setCaseTab}

        onBack={() => {
          setSelectedCase(null)
          setViewOnly(false)

          setPage(
            viewOnly
              ? 'directorate-cases'
              : 'cases'
          )
        }}

        role="sector"

        onActionComplete={() => {
          loadCases()

          setSelectedCase(null)
          setViewOnly(false)
          setPage('cases')
        }}

        onArchive={archived =>
          handleArchive(
            selectedCase.caseId!,
            archived
          )
        }

        archiveError={archiveError}

        readOnly={viewOnly}
      />
    )
  }

  // ============================================================
  // DIRECTORATE CASES — READ ONLY
  // ============================================================

  if (
    page === 'directorate-cases'
  ) {
    return (
      <div className="p-6 space-y-4">

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedDirectorateId(
                null
              )
              setPage('directorates')
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Directorates
          </button>
        </div>

        <h2
          className="text-xl font-black text-gray-900"
          style={{
            fontFamily:
              'var(--font-display)',
          }}
        >
          {selectedDirectorate?.name ??
            'Directorate'}{' '}
          — Cases
        </h2>

        <p className="text-sm text-gray-500 -mt-2">
          Read-only view of cases currently
          assigned to this directorate.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {loadingDirectorateCases ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading cases...
            </div>
          ) : directorateCasesError ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {directorateCasesError}
              </div>
            </div>
          ) : selectedDirectorateCases.length ===
            0 ? (
            <EmptyState
              icon="📁"
              title="No cases here"
              sub="This directorate has no cases assigned right now."
            />
          ) : (
            <CasesSimpleTable
              cases={selectedDirectorateCases.map(
                mapCaseToRecord
              )}
              onOpen={c =>
                openCase(c, true)
              }
            />
          )}

        </div>
      </div>
    )
  }

  // ============================================================
  // STATUS FILTERS
  // ============================================================

  const STATUS_FILTERS = [
    {
      label: 'All',
      value: 'ALL',
    },
    {
      label: 'Submitted',
      value: 'SUBMITTED',
    },
    {
      label: 'In Progress',
      value: 'IN_PROGRESS',
    },
    {
      label: 'Pending Clarification',
      value:
        'PENDING_CLARIFICATION',
    },
    {
      label: 'Returned',
      value:
        'SENT_BACK_FOR_CORRECTION',
    },
    {
      label: 'Approved',
      value: 'APPROVED',
    },
    {
      label: 'Rejected',
      value: 'REJECTED',
    },
    {
      label: 'Archived',
      value: 'ARCHIVED',
    },
  ]

  // ============================================================
  // NORMAL SECTOR CASE FILTER
  // ============================================================

  const filtered = myCases
    .filter(c =>
      page === 'archived'
        ? c.isArchived
        : !c.isArchived
    )
    .filter(
      c =>
        filterStatus === 'ALL' ||
        c.status === filterStatus
    )
    .filter(
      c =>
        c.subject
          .toLowerCase()
          .includes(
            searchQ.toLowerCase()
          ) ||
        c.trackingNumber
          .toLowerCase()
          .includes(
            searchQ.toLowerCase()
          )
    )
    .map(mapCaseToRecord)

  // ============================================================
  // REPORTS
  // ============================================================

  if (page === 'reports') {
    return (
      <div className="p-6 space-y-6">
        <h2
          className="text-xl font-black text-gray-900"
          style={{
            fontFamily:
              'var(--font-display)',
          }}
        >
          Reports
        </h2>

        <ReportsTabs />
      </div>
    )
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  if (page === 'dashboard') {
    return (
      <div className="p-6 space-y-6">

        <div>
          <h1
            className="text-2xl font-black text-gray-900"
            style={{
              fontFamily:
                'var(--font-display)',
            }}
          >
            {t('sectorDashboard')}
          </h1>

          <p className="text-gray-500 text-sm">
            {sectorName}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <KpiCard
            label={t('kpi_totalCases')}
            value={myCases.length}
            icon="📥"
            accent="#2563EB"
          />

          <KpiCard
            label="Rejected Cases"
            value={rejectedCases.length}
            icon="❌"
            accent="#DC2626"
            onClick={() => {
              setFilterStatus(
                'REJECTED'
              )
              setPage('cases')
            }}
            sub={
              rejectedCases.length > 0
                ? 'Needs review'
                : 'None rejected'
            }
          />

          <KpiCard
            label={t(
              'kpi_awaitingDecision'
            )}
            value={
              awaitingDecision.length
            }
            icon="⏳"
            accent="#D97706"
            onClick={() =>
              setPage('cases')
            }
            sub={
              awaitingDecision.length > 0
                ? t(
                    'kpi_actionRequired'
                  )
                : t(
                    'kpi_allResolved'
                  )
            }
          />

          <KpiCard
            label={t('kpi_approved')}
            value={approvedCases.length}
            icon="✅"
            accent="#16A34A"
          />

        </div>

        {/* ── Cases Needing Action ── */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">

            <h2
              className="text-base font-bold text-gray-900"
              style={{
                fontFamily:
                  'var(--font-display)',
              }}
            >
              {t('casesNeedingAction')}
            </h2>

            <button
              onClick={() =>
                setPage('cases')
              }
              className="text-xs text-[#1E4B8F] font-semibold hover:underline"
            >
              {t('viewAll')}
            </button>

          </div>

          <div className="divide-y divide-gray-50">

            {awaitingDecision
              .slice(0, 5)
              .map(c => (
                <div
                  key={c.caseId}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() =>
                    openCase(
                      mapCaseToRecord(c)
                    )
                  }
                >

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-2">

                      <span className="font-mono text-xs font-semibold text-[#1E4B8F]">
                        {c.trackingNumber}
                      </span>

                      <StatusBadge
                        status={formatCaseStatus(
                          c.status,
                          c.isArchived
                        )}
                      />

                    </div>

                    <p className="text-sm font-medium text-gray-800 truncate mt-0.5">
                      {c.subject}
                    </p>

                  </div>

                  <Btn
                    size="sm"
                    onClick={() =>
                      openCase(
                        mapCaseToRecord(c)
                      )
                    }
                  >
                    {t('review')}
                  </Btn>

                </div>
              ))}

            {awaitingDecision.length ===
              0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No cases need action right now.
              </div>
            )}

          </div>
        </div>

        {/* ── Directorate Overview ── */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">

            <h2
              className="text-base font-bold text-gray-900"
              style={{
                fontFamily:
                  'var(--font-display)',
              }}
            >
              Directorate Overview
            </h2>

            <button
              onClick={() =>
                setPage('directorates')
              }
              className="text-xs text-[#1E4B8F] font-semibold hover:underline"
            >
              Manage Directorates →
            </button>

          </div>

          {loadingDirectorates ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Loading directorates...
            </div>
          ) : directorates.length ===
            0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No directorates found for
              this sector.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">

              {directorates.map(d => (
                <div
                  key={d.unitId}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >

                  <div className="flex items-center justify-between">

                    <h3 className="font-semibold text-gray-900">
                      {d.name}
                    </h3>

                    <Btn
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        openDirectorateCases(
                          d.unitId
                        )
                      }
                    >
                      View Cases
                    </Btn>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* ── Case Volume Chart ── */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          <h2
            className="text-base font-bold text-gray-900 mb-5"
            style={{
              fontFamily:
                'var(--font-display)',
            }}
          >
            Case Volume — Last 6 Months
          </h2>

          <BarChart
            data={CHART_DATA}
          />

        </div>

      </div>
    )
  }

  // ============================================================
  // ALL DIRECTORATES
  // ============================================================

  if (page === 'directorates') {
    return (
      <div className="p-6 space-y-4">

        <h2
          className="text-xl font-black text-gray-900"
          style={{
            fontFamily:
              'var(--font-display)',
          }}
        >
          Directorates
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {loadingDirectorates ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading directorates...
            </div>
          ) : directorates.length ===
            0 ? (
            <EmptyState
              icon="🏢"
              title="No directorates found"
              sub="No directorates are set up under this sector yet."
            />
          ) : (
            <div className="divide-y divide-gray-50">

              {directorates.map(d => (
                <div
                  key={d.unitId}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >

                  <h3 className="font-semibold text-gray-900">
                    {d.name}
                  </h3>

                  <Btn
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      openDirectorateCases(
                        d.unitId
                      )
                    }
                  >
                    View Cases
                  </Btn>

                </div>
              ))}

            </div>
          )}

        </div>
      </div>
    )
  }

  // ============================================================
  // TRANSFERRED
  // ============================================================

  if (page === 'transferred') {
    return (
      <div className="p-6 space-y-4">

        <h2
          className="text-xl font-black text-gray-900"
          style={{
            fontFamily:
              'var(--font-display)',
          }}
        >
          Transferred Cases
        </h2>

        <p className="text-sm text-gray-500 -mt-2">
          Read-only history of cases
          transferred between directorates
          in this sector.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {loadingTransfers ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading transfer history...
            </div>
          ) : transfersError ? (
            <div className="p-6">

              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {transfersError}
              </div>

            </div>
          ) : transfers.length ===
            0 ? (
            <EmptyState
              icon="⇄"
              title="No transfers yet"
              sub="No cases have been transferred between directorates in this sector."
            />
          ) : (
            <TransferHistoryTable
              transfers={transfers}
            />
          )}

        </div>
      </div>
    )
  }

  // ============================================================
  // ARCHIVED
  // ============================================================

  if (page === 'archived') {
    return (
      <div className="p-6 space-y-4">

        <h2
          className="text-xl font-black text-gray-900"
          style={{
            fontFamily:
              'var(--font-display)',
          }}
        >
          {t('archivedCases')}
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {loadingCases ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : filtered.length ===
            0 ? (
            <EmptyState
              icon="🗃"
              title={t(
                'empty_noArchived'
              )}
              sub={t(
                'empty_noArchivedDesc'
              )}
            />
          ) : (
            <CasesSimpleTable
              cases={filtered}
              onOpen={openCase}
            />
          )}

        </div>
      </div>
    )
  }

  // ============================================================
  // ALL SECTOR CASES
  // ============================================================

  return (
    <div className="p-6 space-y-4">

      <div className="flex items-center justify-between flex-wrap gap-3">

        <h2
          className="text-xl font-black text-gray-900"
          style={{
            fontFamily:
              'var(--font-display)',
          }}
        >
          {t('cases')}
        </h2>

        <input
          type="text"
          value={searchQ}
          onChange={e =>
            setSearchQ(e.target.value)
          }
          placeholder="Search…"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20"
        />

      </div>

      <div className="flex gap-2 flex-wrap">

        {STATUS_FILTERS.map(status => (
          <button
            key={status.value}
            onClick={() =>
              setFilterStatus(
                status.value
              )
            }
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterStatus ===
              status.value
                ? 'bg-[#1E4B8F] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {status.label}
          </button>
        ))}

      </div>

      {casesError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {casesError}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

        {loadingCases ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading cases...
          </div>
        ) : filtered.length ===
          0 ? (
          <EmptyState
            icon="📁"
            title={t(
              'empty_noCases'
            )}
          />
        ) : (
          <CasesSimpleTable
            cases={filtered}
            onOpen={openCase}
          />
        )}

      </div>
    </div>
  )
}

// ============================================================
// CASES TABLE
// ============================================================

function CasesSimpleTable({
  cases,
  onOpen,
}: {
  cases: CaseRecord[]
  onOpen: (c: CaseRecord) => void
}) {
  const { t } = useLanguage()

  return (
    <div className="overflow-x-auto">

      <table className="w-full text-sm">

        <thead>
          <tr className="border-b border-gray-100">

            {[
              t('col_trackingNo'),
              t('col_subject'),
              t('col_customer'),
              t('col_status'),
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

              <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[160px] truncate">
                {c.subject}
              </td>

              <td className="px-5 py-3.5 text-gray-600">
                {c.customer}
              </td>

              <td className="px-5 py-3.5">
                <StatusBadge
                  status={c.status}
                />
              </td>

              <td className="px-5 py-3.5 text-gray-400 text-xs">
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

// ============================================================
// TRANSFER HISTORY TABLE
// ============================================================

function TransferHistoryTable({
  transfers,
}: {
  transfers: TransferEvent[]
}) {
  return (
    <div className="overflow-x-auto">

      <table className="w-full text-sm">

        <thead>
          <tr className="border-b border-gray-100">

            {[
              'Tracking No',
              'From Directorate',
              'To Directorate',
              'Remark',
              'By',
              'Date',
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

          {transfers.map(tr => (
            <tr
              key={tr.auditLogId}
              className="border-b border-gray-50"
            >

              <td className="px-5 py-3.5 font-mono font-semibold text-[#1E4B8F] text-xs">
                {tr.trackingNumber}
              </td>

              <td className="px-5 py-3.5 text-gray-600">
                {tr.fromUnitName}
              </td>

              <td className="px-5 py-3.5 text-gray-600">
                {tr.toUnitName}
              </td>

              <td className="px-5 py-3.5 text-gray-500 max-w-[220px] truncate">
                {tr.remarks ?? '—'}
              </td>

              <td className="px-5 py-3.5 text-gray-500 text-xs">
                {tr.byName}
              </td>

              <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                {new Date(
                  tr.createdAt
                ).toLocaleString()}
              </td>

            </tr>
          ))}

        </tbody>
      </table>

    </div>
  )
}

// ============================================================
// REPORTS
// ============================================================

function ReportsTabs() {
  return (
    <div className="text-sm text-gray-400 p-6">
      Reports coming from real data in a later pass.
    </div>
  )
}

// ============================================================
// CHART DATA
// ============================================================

const CHART_DATA = [
  {
    month: 'Mon',
    received: 4,
    approved: 2,
    rejected: 0,
  },
  {
    month: 'Tue',
    received: 7,
    approved: 4,
    rejected: 1,
  },
  {
    month: 'Wed',
    received: 5,
    approved: 3,
    rejected: 0,
  },
  {
    month: 'Thu',
    received: 8,
    approved: 5,
    rejected: 1,
  },
  {
    month: 'Fri',
    received: 6,
    approved: 3,
    rejected: 1,
  },
]
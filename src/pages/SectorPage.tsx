import { useState, useEffect } from 'react'
import { StatusBadge, KpiCard, Btn, BarChart, TabBar, EmptyState, PriorityBadge, CaseTimeline, Modal, Textarea, Select } from '../components/ui'
import { CaseDetail } from './RecordsPage'
import type { CaseRecord, CaseStatus } from '../types'
import { useLanguage } from '../i18n'
import { getOrganizations, type OrganizationUnit } from '../api/organizations.api'
import { formatCaseStatus, mapCaseToRecord } from '../utils/caseMappers'
import {
  getCases,
  toggleCaseArchive,
  type CaseItem,
} from '../api/cases.api'
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


export default function SectorPage({ page, setPage, sectorName, sectorUnitId }: Props) {
  const { t } = useLanguage()

  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null)
  const [caseTab, setCaseTab] = useState('Overview')
  //const [filterStatus, setFilterStatus] = useState('All')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchQ, setSearchQ] = useState('')

  const [allCases, setAllCases] = useState<CaseItem[]>([])
  const [loadingCases, setLoadingCases] = useState(true)
  const [casesError, setCasesError] = useState('')

  const [directorates, setDirectorates] = useState<DirectorateWithStats[]>([])
  const [loadingDirectorates, setLoadingDirectorates] = useState(true)
  const [selectedDirectorateId, setSelectedDirectorateId] =
  useState<string | null>(null)

  async function loadCases() {
    try {
      setLoadingCases(true)
      setCasesError('')
      const result = await getCases()
      setAllCases(result.data ?? [])
    } catch (err: any) {
      console.error('Failed to load cases:', err)
      setCasesError(err.response?.data?.message || 'Failed to load cases.')
    } finally {
      setLoadingCases(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  const [archiveError, setArchiveError] = useState('')
  async function handleArchive(caseId: string, archived: boolean) {
    try {
      await toggleCaseArchive(caseId, archived)
  
      await loadCases()
  
      setSelectedCase(null)
      setPage(archived ? 'archived' : 'cases')
    } catch (err: any) {
      console.error('Failed to update archive status:', err)
  
      setCasesError(
        err.response?.data?.message ||
        'Failed to update case archive status.'
      )
    }
  }

  useEffect(() => {
    async function loadDirectorates() {
      try {
        setLoadingDirectorates(true)
        const result = await getOrganizations({ unitType: 'DIRECTORATE', isActive: true })
        const all = result.data ?? []
        
        // Filter directorates that belong to this sector
        const sectorDirectorates = all.filter((d: any) => d.parentUnitId === sectorUnitId)
        
        // Calculate stats for each directorate
        const directoratesWithStats: DirectorateWithStats[] = sectorDirectorates.map((d: OrganizationUnit) => {
          // Find cases assigned to this directorate
          const directorateCases = allCases.filter(c => c.currentUnit?.unitId === d.unitId)
          
          const activeCount = directorateCases.filter(c => 
            c.status === 'SUBMITTED' || 
            c.status === 'UNDER_REVIEW' || 
            c.status === 'IN_PROGRESS' ||
            c.status === 'PENDING_CLARIFICATION'
          ).length
          
          const pendingDecisionCount = directorateCases.filter(c => 
            c.status === 'UNDER_REVIEW'
          ).length
          
          const delayedCount = directorateCases.filter(c => {
            // Check if case is delayed (older than 7 days)
            const submittedDate = new Date(c.submittedAt)
            const now = new Date()
            const diffTime = Math.abs(now.getTime() - submittedDate.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays > 7 && c.status !== 'APPROVED' && c.status !== 'REJECTED' && c.status !== 'ARCHIVED'
          }).length
          
          return {
            ...d,
            activeCount,
            pendingDecisionCount,
            delayedCount,
          }
        })
        
        setDirectorates(directoratesWithStats)
      } catch (err) {
        console.error('Failed to load directorates:', err)
      } finally {
        setLoadingDirectorates(false)
      }
    }
    if (sectorUnitId) loadDirectorates()
  }, [sectorUnitId, allCases])

  // Cases currently sitting at THIS sector
  const myCases = allCases.filter(
    c => c.currentUnit?.unitId === sectorUnitId
  )

  const awaitingDecision = myCases.filter(c => c.status === 'UNDER_REVIEW')
  const approvedCases = myCases.filter(c => c.status === 'APPROVED')
  const rejectedCases = myCases.filter(c => c.status === 'REJECTED')
  const archivedCases = myCases.filter(c => c.isArchived)

  function openCase(c: CaseRecord) {
    setSelectedCase(c)
    setPage('case-detail')
    setCaseTab('Overview')
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
  role="sector"
  onActionComplete={() => {
    loadCases()
    setSelectedCase(null)
    setPage('cases')
  }}
  onArchive={(archived) => handleArchive(selectedCase.id, archived)}
/>
    )
  }

  const STATUS_FILTERS = [
    { label: 'All', value: 'ALL' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Pending Clarification', value: 'PENDING_CLARIFICATION' },
    { label: 'Returned', value: 'SENT_BACK_FOR_CORRECTION' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Archived', value: 'ARCHIVED' },
  ]
 // const statuses = ['All', 'Submitted', 'In Progress', 'Pending Clarification', 'Returned', 'Approved', 'Rejected', 'Archived']

 const filtered = myCases
 .filter(c =>
   page === 'archived'
     ? c.isArchived
     : !c.isArchived
 )
 .filter(c =>
   filterStatus === 'ALL' ||
   c.status === filterStatus
 )
 .filter(c =>
   c.subject.toLowerCase().includes(searchQ.toLowerCase()) ||
   c.trackingNumber.toLowerCase().includes(searchQ.toLowerCase())
 )
 .map(mapCaseToRecord)

  if (page === 'reports') {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Reports</h2>
        <ReportsTabs />
      </div>
    )
  }

  // ── Dashboard ──
  if (page === 'dashboard') {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('sectorDashboard')}</h1>
          <p className="text-gray-500 text-sm">{sectorName}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label={t('kpi_totalCases')} value={myCases.length} icon="📥" accent="#2563EB" />
          <KpiCard
            label="Rejected Cases"
            value={rejectedCases.length}
            icon="❌"
            accent="#DC2626"
            onClick={() => {
              setFilterStatus('Rejected')
              setPage('cases')
            }}
            sub={rejectedCases.length > 0 ? 'Needs review' : 'None rejected'}
          />
          <KpiCard
            label={t('kpi_awaitingDecision')}
            value={awaitingDecision.length}
            icon="⏳"
            accent="#D97706"
            onClick={() => setPage('cases')}
            sub={awaitingDecision.length > 0 ? t('kpi_actionRequired') : t('kpi_allResolved')}
          />
          <KpiCard label={t('kpi_approved')} value={approvedCases.length} icon="✅" accent="#16A34A" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('casesNeedingAction')}</h2>
            <button onClick={() => setPage('cases')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('viewAll')}</button>
          </div>
          <div className="divide-y divide-gray-50">
            {awaitingDecision.slice(0, 5).map(c => (
              <div key={c.caseId} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openCase(mapCaseToRecord(c))}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#1E4B8F]">{c.trackingNumber}</span>
                    <StatusBadge status={formatCaseStatus(c.status)} />
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{c.subject}</p>
                </div>
                <Btn size="sm" onClick={() => openCase(mapCaseToRecord(c))}>{t('review')}</Btn>
              </div>
            ))}
            {awaitingDecision.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No cases need action right now.</div>
            )}
          </div>
        </div>

        {/* ── Directorate Overview ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Directorate Overview</h2>
            <button onClick={() => setPage('groups')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">
              Manage Directorates →
            </button>
          </div>
          
          {loadingDirectorates ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading directorates...</div>
          ) : directorates.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No directorates found for this sector.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {directorates.map(d => (
                <div key={d.unitId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{d.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">{d.activeCount}</span> Active
                        </span>
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">{d.pendingDecisionCount}</span> Pending Decision
                        </span>
                        {d.delayedCount > 0 && (
                          <span className="text-amber-600 flex items-center gap-1">
                            <span>⚠️</span>
                            <span className="font-semibold">{d.delayedCount}</span> Delayed
                          </span>
                        )}
                      </div>
                    </div>
                    <Btn 
                      size="sm" 
                      variant="secondary"
                      onClick={() => {
                        // Navigate to cases filtered by this directorate
                        setPage('cases')
                      }}
                    >
                      View Cases
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Case Volume Chart (keep it) ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Case Volume — Last 6 Months</h2>
          <BarChart data={CHART_DATA} />
        </div>
      </div>
    )
  }

  // ── Archived ──
  if (page === 'archived') {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('archivedCases')}</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {loadingCases ? (
            <div className="p-10 text-center text-sm text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="🗃" title={t('empty_noArchived')} sub={t('empty_noArchivedDesc')} />
          ) : (
            <CasesSimpleTable cases={filtered} onOpen={openCase} />
          )}
        </div>
      </div>
    )
  }

  // ── All cases list ──
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('cases')}</h2>
        <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search…"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20" />
      </div>

      <div className="flex gap-2 flex-wrap">
      {STATUS_FILTERS.map(status => (
  <button
    key={status.value}
    onClick={() => setFilterStatus(status.value)}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
      filterStatus === status.value
        ? 'bg-[#1E4B8F] text-white'
        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
    }`}
  >
    {status.label}
  </button>
))}
      </div>

      {casesError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{casesError}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loadingCases ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading cases...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📁" title={t('empty_noCases')} />
        ) : (
          <CasesSimpleTable cases={filtered} onOpen={openCase} />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
function CasesSimpleTable({ cases, onOpen }: { cases: CaseRecord[]; onOpen: (c: CaseRecord) => void }) {
  const { t } = useLanguage()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {[t('col_trackingNo'), t('col_subject'), t('col_customer'), t('col_status'), t('col_date'), ''].map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map(c => (
            <tr key={c.id} onClick={() => onOpen(c)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
              <td className="px-5 py-3.5 font-mono font-semibold text-[#1E4B8F] text-xs">{c.id}</td>
              <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[160px] truncate">{c.subject}</td>
              <td className="px-5 py-3.5 text-gray-600">{c.customer}</td>
              <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{c.date}</td>
              <td className="px-5 py-3.5"><button className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('view')}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReportsTabs() {
  return <div className="text-sm text-gray-400 p-6">Reports coming from real data in a later pass.</div>
}

// ── Chart Data ──
const CHART_DATA = [
  { month: 'Mon', received: 4, approved: 2, rejected: 0 },
  { month: 'Tue', received: 7, approved: 4, rejected: 1 },
  { month: 'Wed', received: 5, approved: 3, rejected: 0 },
  { month: 'Thu', received: 8, approved: 5, rejected: 1 },
  { month: 'Fri', received: 6, approved: 3, rejected: 1 },
]
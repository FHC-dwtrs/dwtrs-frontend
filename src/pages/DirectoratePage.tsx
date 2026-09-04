import { useState, useEffect } from 'react'
import { StatusBadge, KpiCard, Btn, EmptyState, PriorityBadge } from '../components/ui'
import { CaseDetail } from './RecordsPage'
import type { CaseRecord } from '../types'
import { useLanguage } from '../i18n'
import { getCases, type CaseItem } from '../api/cases.api'
import { getOrganizations, type OrganizationUnit } from '../api/organizations.api'
import { mapCaseToRecord } from '../utils/caseMappers'

interface Props {
  page: string
  setPage: (p: string) => void
  directorateName: string
  directorateUnitId: string
}

interface GroupWithStats extends OrganizationUnit {
  activeCount: number
  pendingCount: number
  delayedCount: number
}

export default function DirectoratePage({ page, setPage, directorateName, directorateUnitId }: Props) {
  const { t } = useLanguage()
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null)
  const [caseTab, setCaseTab] = useState('Overview')
  const [filterStatus, setFilterStatus] = useState('All')

  const [allCases, setAllCases] = useState<CaseItem[]>([])
  const [loadingCases, setLoadingCases] = useState(true)
  const [casesError, setCasesError] = useState('')

  const [groups, setGroups] = useState<GroupWithStats[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

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

  // Cases currently sitting at THIS directorate
  //const dirCases = allCases.filter(c => c.currentUnit?.unitId === directorateUnitId)
  const dirCases = allCases.filter(
    c => c.currentUnit?.unitId === directorateUnitId
  )
  //const dirCases = allCases
  useEffect(() => {
    async function loadGroups() {
      try {
        setLoadingGroups(true)
        const result = await getOrganizations({ unitType: 'GROUP', isActive: true })
        const all = result.data ?? []
        const dirGroups = all.filter((g: any) => g.parentUnitId === directorateUnitId)

        const groupsWithStats: GroupWithStats[] = dirGroups.map((g: OrganizationUnit) => {
          const groupCases = allCases.filter(c => c.currentUnit?.unitId === g.unitId)
          const activeCount = groupCases.filter(c =>
            c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW' || c.status === 'IN_PROGRESS' || c.status === 'PENDING_CLARIFICATION'
          ).length
          const pendingCount = groupCases.filter(c => c.status === 'UNDER_REVIEW').length
          const delayedCount = groupCases.filter(c => {
            const diffDays = Math.ceil((Date.now() - new Date(c.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
            return diffDays > 7 && c.status !== 'APPROVED' && c.status !== 'REJECTED' && c.status !== 'ARCHIVED'
          }).length
          return { ...g, activeCount, pendingCount, delayedCount }
        })

        setGroups(groupsWithStats)
      } catch (err) {
        console.error('Failed to load groups:', err)
      } finally {
        setLoadingGroups(false)
      }
    }
    if (directorateUnitId) loadGroups()
  }, [directorateUnitId, allCases])

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
        onBack={() => { setSelectedCase(null); setPage('cases') }}
        role="directorate"
        onActionComplete={() => { loadCases(); setSelectedCase(null); setPage('cases') }}
      />
    )
  }

  const statuses = ['All', 'Submitted', 'In Progress', 'Pending Clarification', 'Returned', 'Approved', 'Rejected', 'Archived']

  const filteredCases = dirCases
    .filter(c => filterStatus === 'All' || mapCaseToRecord(c).status === filterStatus)
    .map(mapCaseToRecord)

  if (page === 'groups') {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('groupOverview')}</h2>
        {loadingGroups ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-gray-400">No groups found for this directorate.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map(g => (
              <div key={g.unitId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">{g.name}</h3>
                  {g.delayedCount > 0 && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-semibold">
                      ⚠ {g.delayedCount} {t('delayed')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[[t('active'), g.activeCount], [t('kpi_pending'), g.pendingCount], [t('delayed'), g.delayedCount]].map(([l, v]) => (
                    <div key={l as string} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">{l}</p>
                      <p className="text-xl font-black text-gray-900">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (page === 'dashboard') {
    const needsAssignment = dirCases.filter(c => c.status === 'SUBMITTED')
    const awaitingDecision = dirCases.filter(c => c.status === 'UNDER_REVIEW')

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('directorateDashboard')}</h1>
          <p className="text-gray-500 text-sm">{directorateName}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KpiCard label={t('kpi_activeCases')} value={dirCases.length} icon="🔄" onClick={() => setPage('cases')} />
          <KpiCard label={t('kpi_pendingGroups')} value={awaitingDecision.length} icon="⏳" accent="#D97706" onClick={() => setPage('cases')} />
          <KpiCard label="Needs Assignment" value={needsAssignment.length} icon="📥" accent="#2563EB" onClick={() => setPage('cases')} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('casesNeedingAction')}</h2>
              <button onClick={() => setPage('cases')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('viewAll')}</button>
            </div>
            <div className="divide-y divide-gray-50">
              {[...needsAssignment, ...awaitingDecision].slice(0, 4).map(c => {
                const rec = mapCaseToRecord(c)
                return (
                  <div key={c.caseId} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openCase(rec)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs font-semibold text-[#1E4B8F]">{c.trackingNumber}</span>
                        <StatusBadge status={rec.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{c.subject}</p>
                    </div>
                    <Btn size="sm">{t('review')}</Btn>
                  </div>
                )
              })}
              {needsAssignment.length === 0 && awaitingDecision.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-gray-400">No cases need action right now.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('groupOverview')}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {groups.map(g => (
                <div key={g.unitId} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-gray-800">{g.name}</p>
                    {g.delayedCount > 0 && <span className="text-xs text-red-600 font-semibold">⚠ {t('delayed')}</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span><strong className="text-gray-800">{g.activeCount}</strong> {t('active')}</span>
                    <span><strong className="text-gray-800">{g.pendingCount}</strong> {t('pendingDecision')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-50">
              <button onClick={() => setPage('groups')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('manageGroups')}</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Cases list ──
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('cases')}</h2>

      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === s ? 'bg-[#1E4B8F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s}
          </button>
        ))}
      </div>

      {casesError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{casesError}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loadingCases ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading cases...</div>
        ) : filteredCases.length === 0 ? (
          <EmptyState icon="📁" title={t('empty_noCases')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t('col_trackingNo'), t('col_subject'), t('col_status'), t('col_priority'), t('col_lastActivity'), ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCases.map(c => (
                  <tr key={c.id} onClick={() => openCase(c)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#1E4B8F] text-xs">{c.id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[180px] truncate">{c.subject}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{c.lastActivity}</td>
                    <td className="px-5 py-3.5"><button className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('review')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
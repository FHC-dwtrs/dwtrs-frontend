import { useState } from 'react'
import { CASES, CHART_DATA } from '../data'
import { StatusBadge, KpiCard, Btn, BarChart, TabBar, EmptyState, PriorityBadge, CaseTimeline, Modal, Textarea } from '../components/ui'
import { CaseDetail } from './RecordsPage'
import type { CaseRecord, CaseStatus } from '../types'
import { useLanguage } from '../i18n'

interface Props {
  page: string
  setPage: (p: string) => void
  sectorName: string
}

// Sector display name → short key used in case data
const SECTOR_KEY: Record<string, string> = {
  'Housing Development Sector':        'Housing Development',
  'Corporate Service Sector':          'Corporate Service',
  'Houses Administration Sector':      'Houses Administration',
  'Construction Input Supply Sector':  'Construction Input Supply',
}

// Per-sector directorates
const SECTOR_DIRECTORATES: Record<string, { name: string; active: number; pending: number; delayed: number }[]> = {
  'Housing Development Sector': [
    { name: 'Directorate A', active: 8, pending: 2, delayed: 1 },
    { name: 'Directorate B', active: 10, pending: 2, delayed: 2 },
    { name: 'Directorate C', active: 6, pending: 1, delayed: 1 },
  ],
  'Corporate Service Sector': [
    { name: 'Directorate A', active: 6, pending: 1, delayed: 0 },
    { name: 'Directorate B', active: 5, pending: 1, delayed: 1 },
  ],
  'Houses Administration Sector': [
    { name: 'Directorate A', active: 4, pending: 1, delayed: 0 },
    { name: 'Directorate B', active: 4, pending: 2, delayed: 2 },
  ],
  'Construction Input Supply Sector': [
    { name: 'Directorate A', active: 7, pending: 2, delayed: 1 },
    { name: 'Directorate B', active: 8, pending: 2, delayed: 2 },
    { name: 'Directorate C', active: 5, pending: 1, delayed: 1 },
  ],
}

// Per-sector cases returned for final decision (Waiting queue)
const SECTOR_WAITING: Record<string, string[]> = {
  'Housing Development Sector':        ['FHC-2026-001', 'FHC-2026-008'],
  'Corporate Service Sector':          ['FHC-2026-003'],
  'Houses Administration Sector':      ['FHC-2026-005'],
  'Construction Input Supply Sector':  ['FHC-2026-004', 'FHC-2026-007'],
}

// Per-sector workflow activity feed (shows relevant case IDs for that sector)
const SECTOR_ACTIVITY: Record<string, { icon: string; text: string; sub: string; time: string; case: string }[]> = {
  'Housing Development Sector': [
    { icon: '🔄', text: 'FHC-2026-007: Directorate A → Directorate B', sub: 'Reason: Case falls under Directorate B', time: '10:32 AM', case: 'FHC-2026-007' },
    { icon: '↩️', text: 'FHC-2026-004: Group A2 → Directorate A', sub: 'Returned for additional review', time: '09:45 AM', case: 'FHC-2026-004' },
    { icon: '→', text: 'FHC-2026-008: Directorate C → Sector', sub: 'Work completed — awaiting final decision', time: '09:20 AM', case: 'FHC-2026-008' },
    { icon: '✓', text: 'FHC-2026-002: Sector approved', sub: 'Land Allocation Request — Approved', time: 'Yesterday 05:00 PM', case: 'FHC-2026-002' },
  ],
  'Corporate Service Sector': [
    { icon: '→', text: 'FHC-2026-003: Directorate A → Sector', sub: 'Work completed — awaiting final decision', time: '11:00 AM', case: 'FHC-2026-003' },
  ],
  'Houses Administration Sector': [
    { icon: '→', text: 'FHC-2026-005: Directorate B → Sector', sub: 'Pending clarification resolved — awaiting ruling', time: '09:30 AM', case: 'FHC-2026-005' },
  ],
  'Construction Input Supply Sector': [
    { icon: '🔄', text: 'FHC-2026-004: Group A2 → Directorate A', sub: 'Returned for additional review', time: '08:45 AM', case: 'FHC-2026-004' },
    { icon: '⚠️', text: 'FHC-2026-007: Delayed — 12 days', sub: 'Currently in Group B1 — no update', time: '08:00 AM', case: 'FHC-2026-007' },
  ],
}

type Decision = 'Approved' | 'Rejected'
interface CaseDecision {
  decision: Decision
  archive: boolean
  reason?: string
  timestamp: string
}

export default function SectorPage({ page, setPage, sectorName }: Props) {
  const { t } = useLanguage()
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null)
  const [caseTab, setCaseTab] = useState('Overview')
  const [filterStatus, setFilterStatus] = useState('All')
  const [searchQ, setSearchQ] = useState('')
  const [decisions, setDecisions] = useState<Record<string, CaseDecision>>({})
  const [waitingSelected, setWaitingSelected] = useState<CaseRecord | null>(null)

  // Derive sector-specific data from the sectorName prop
  const sectorKey = SECTOR_KEY[sectorName] ?? sectorName
  const DIRECTORATES = SECTOR_DIRECTORATES[sectorName] ?? []
  const WAITING_IDS = SECTOR_WAITING[sectorName] ?? []
  const WORKFLOW_ACTIVITY = SECTOR_ACTIVITY[sectorName] ?? []

  function openCase(c: CaseRecord) {
    setSelectedCase(c)
    setPage('case-detail')
    setCaseTab('Overview')
  }

  function recordDecision(id: string, decision: Decision, archive: boolean, reason?: string) {
    setDecisions(prev => ({
      ...prev,
      [id]: { decision, archive, reason, timestamp: 'Aug 15, 2026 — ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
    }))
  }

  function toggleArchive(id: string) {
    setDecisions(prev => ({
      ...prev,
      [id]: { ...prev[id], archive: !prev[id].archive },
    }))
  }

  if (page === 'case-detail' && selectedCase) {
    return <CaseDetail c={selectedCase} tab={caseTab} setTab={setCaseTab} onBack={() => { setSelectedCase(null); setPage('cases') }} role="sector" />
  }

  if (page === 'waiting') {
    if (waitingSelected) {
      return (
        <WaitingCaseDetail
          c={waitingSelected}
          decision={decisions[waitingSelected.id]}
          onDecision={(d, reason) => recordDecision(waitingSelected.id, d, false, reason)}
          onToggleArchive={() => toggleArchive(waitingSelected.id)}
          onBack={() => setWaitingSelected(null)}
        />
      )
    }
    return (
      <WaitingList
        waitingIds={WAITING_IDS}
        sectorName={sectorName}
        decisions={decisions}
        onOpen={setWaitingSelected}
        onToggleArchive={toggleArchive}
      />
    )
  }

  const statuses = ['All', 'New', 'In Progress', 'Pending Clarification', 'Returned', 'Delayed', 'Approved', 'Rejected', 'Archived']

  // Only show cases belonging to this sector
  const sectorCases = CASES.filter(c => c.sector === sectorKey)

  // Merge in any decisions made via the Waiting queue
  const effectiveCases: (CaseRecord & { effectiveStatus?: CaseStatus; archived?: boolean })[] = sectorCases.map(c => {
    const dec = decisions[c.id]
    if (dec) return { ...c, effectiveStatus: dec.decision, archived: dec.archive }
    return c
  })

  const archived = effectiveCases.filter(c => c.archived)
  const filtered = effectiveCases.filter(c => {
    if (page === 'archived') return c.archived
    if (c.archived) return false
    const status = c.effectiveStatus || c.status
    return (filterStatus === 'All' || status === filterStatus) &&
      (c.subject.toLowerCase().includes(searchQ.toLowerCase()) || c.id.toLowerCase().includes(searchQ.toLowerCase()))
  })

  if (page === 'reports') {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Reports</h2>
        <ReportsTabs />
      </div>
    )
  }

  if (page === 'workflow') {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Workflow Activity</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {WORKFLOW_ACTIVITY.map((w, i) => (
            <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => { const c = sectorCases.find(x => x.id === w.case); if (c) openCase(c) }}>
              <span className="text-xl mt-0.5">{w.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{w.text}</p>
                <p className="text-xs text-gray-500 mt-0.5">{w.sub}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">{w.time}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (page === 'dashboard') {
    const waitingCount = WAITING_IDS.filter(id => !decisions[id]).length
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('sectorDashboard')}</h1>
          <p className="text-gray-500 text-sm">{sectorName} · August 15, 2026</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label={t('kpi_activeCases')} value={sectorCases.filter(c => !['Approved','Rejected','Archived'].includes(c.status)).length} icon="🔄" onClick={() => { setFilterStatus('In Progress'); setPage('cases') }} />
          <KpiCard label={t('kpi_totalCases')} value={sectorCases.length} icon="📥" accent="#2563EB" />
          <KpiCard
            label={t('kpi_awaitingDecision')}
            value={waitingCount}
            icon="⏳"
            accent="#D97706"
            onClick={() => setPage('waiting')}
            sub={waitingCount > 0 ? t('kpi_actionRequired') : t('kpi_allResolved')}
          />
          <KpiCard label={t('kpi_approved')} value={sectorCases.filter(c => c.status === 'Approved').length} icon="✅" accent="#16A34A" />
          <KpiCard label={t('kpi_rejected')} value={sectorCases.filter(c => c.status === 'Rejected').length} icon="❌" accent="#DC2626" />
          <KpiCard label={t('kpi_delayed')} value={sectorCases.filter(c => c.status === 'Delayed').length} icon="⚠️" accent="#DC2626" onClick={() => { setFilterStatus('Delayed'); setPage('cases') }} />
        </div>

        {waitingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">⏳</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">{waitingCount} {waitingCount === 1 ? t('awaitingAlert') : t('awaitingAlertPlural')}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t('awaitingAlertDesc')}</p>
            </div>
            <Btn onClick={() => setPage('waiting')} variant="secondary" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-100 flex-shrink-0">
              {t('reviewNow')}
            </Btn>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('casesNeedingAction')}</h2>
              <button onClick={() => setPage('cases')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('viewAll')}</button>
            </div>
            <div className="divide-y divide-gray-50">
              {sectorCases.filter(c => ['New', 'Submitted', 'Returned'].includes(c.status)).slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openCase(c)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#1E4B8F]">{c.id}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{c.subject}</p>
                  </div>
                  <Btn size="sm" onClick={() => openCase(c)}>{t('review')}</Btn>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('directorateOverview')}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {DIRECTORATES.map(d => (
                <div key={d.name} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-800">{d.name}</p>
                    {d.delayed > 0 && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">⚠ {d.delayed} delayed</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span><strong className="text-gray-800">{d.active}</strong> active</span>
                    <span><strong className="text-gray-800">{d.pending}</strong> pending</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1E4B8F] rounded-full" style={{ width: `${(d.active / 12) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('caseVolumeChart')}</h2>
          </div>
          <BarChart data={CHART_DATA} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('recentWorkflow')}</h2>
            <button onClick={() => setPage('workflow')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('seeAll')}</button>
          </div>
          <div className="divide-y divide-gray-50">
            {WORKFLOW_ACTIVITY.slice(0, 3).map((w, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-3.5">
                <span className="text-base mt-0.5">{w.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{w.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{w.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (page === 'archived') {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('archivedCases')}</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {archived.length === 0 ? (
            <EmptyState icon="🗃" title={t('empty_noArchived')} sub={t('empty_noArchivedDesc')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[t('col_trackingNo'), t('col_subject'), t('col_customer'), t('col_finalDecision'), t('col_priority'), t('archived')].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archived.map(c => {
                    const dec = decisions[c.id]
                    return (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openCase(c)}>
                        <td className="px-5 py-3.5 font-mono font-semibold text-[#1E4B8F] text-xs">{c.id}</td>
                        <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[160px] truncate">{c.subject}</td>
                        <td className="px-5 py-3.5 text-gray-600">{c.customer}</td>
                        <td className="px-5 py-3.5">
                          {dec && <StatusBadge status={dec.decision} />}
                        </td>
                        <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">{dec?.timestamp || c.date}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // All cases list
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('cases')}</h2>
        <div className="flex gap-3">
          <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search…" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === s ? 'bg-[#1E4B8F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {filtered.length === 0 ? (
          <EmptyState icon="📁" title={t('empty_noCases')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t('col_trackingNo'), t('col_subject'), t('col_customer'), t('col_status'), t('col_location'), t('col_priority'), t('col_lastActivity'), ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const displayStatus = (c.effectiveStatus || c.status) as CaseStatus
                  return (
                    <tr key={c.id} onClick={() => openCase(c)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#1E4B8F] text-xs">{c.id}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[160px] truncate">{c.subject}</td>
                      <td className="px-5 py-3.5 text-gray-600">{c.customer}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={displayStatus} /></td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{c.directorate} → {c.group}</td>
                      <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{c.lastActivity}</td>
                      <td className="px-5 py-3.5"><button className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('review')}</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Waiting List ───────────────────────────────────────
function WaitingList({
  waitingIds,
  sectorName,
  decisions,
  onOpen,
  onToggleArchive,
}: {
  waitingIds: string[]
  sectorName: string
  decisions: Record<string, CaseDecision>
  onOpen: (c: CaseRecord) => void
  onToggleArchive: (id: string) => void
}) {
  const { t } = useLanguage()
  const waitingCases = CASES.filter(c => waitingIds.includes(c.id))
  const pending = waitingCases.filter(c => !decisions[c.id])
  const decided = waitingCases.filter(c => !!decisions[c.id])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('waitingTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('waitingSubtitle')}</p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">{t('awaitingDecisionSection')}</span>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          {pending.map(c => (
            <WaitingCard key={c.id} c={c} decision={null} onOpen={onOpen} onToggleArchive={onToggleArchive} />
          ))}
        </div>
      )}

      {pending.length === 0 && decided.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-2xl px-6 py-5 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-bold text-green-800">{t('allDecisionsDone')}</p>
            <p className="text-xs text-green-600">{t('allDecisionsDoneDesc')}</p>
          </div>
        </div>
      )}

      {decided.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('decidedSection')}</span>
          {decided.map(c => (
            <WaitingCard key={c.id} c={c} decision={decisions[c.id]} onOpen={onOpen} onToggleArchive={onToggleArchive} />
          ))}
        </div>
      )}
    </div>
  )
}

function WaitingCard({
  c,
  decision,
  onOpen,
  onToggleArchive,
}: {
  c: CaseRecord
  decision: CaseDecision | null
  onOpen: (c: CaseRecord) => void
  onToggleArchive: (id: string) => void
}) {
  const { t } = useLanguage()
  const decided = !!decision

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all ${decided ? 'border-gray-100 opacity-90' : 'border-amber-200 ring-1 ring-amber-100'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#1E4B8F]">{c.id}</span>
              {decided ? (
                <StatusBadge status={decision!.decision} />
              ) : (
                <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{t('awaitingBadge')}</span>
              )}
              <PriorityBadge priority={c.priority} />
            </div>
            <p className="text-base font-bold text-gray-900 truncate">{c.subject}</p>
            <div className="flex gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
              <span>👤 {c.customer}</span>
              <span>🏛 {c.directorate}</span>
              <span>📅 {c.lastActivity}</span>
            </div>
            {decided && decision!.reason && (
              <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2 italic">
                "{decision!.reason}"
              </p>
            )}
          </div>

          {decided && (
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">{t('archiveToggleLabel')}</span>
                <button
                  onClick={() => onToggleArchive(c.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${decision!.archive ? 'bg-[#1E4B8F]' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${decision!.archive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {decision!.archive && (
                <span className="text-xs text-[#1E4B8F] font-semibold bg-blue-50 px-2 py-0.5 rounded-full">🗃 {t('status_Archived')}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Btn variant="secondary" size="sm" onClick={() => onOpen(c)}>
            {t('view')}
          </Btn>
          {!decided && (
            <Btn size="sm" onClick={() => onOpen(c)} className="bg-amber-500 hover:bg-amber-600 text-white border-0">
              {t('giveDecision')}
            </Btn>
          )}
          {decided && (
            <span className="text-xs text-gray-400">{decision!.timestamp}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Waiting Case Detail ────────────────────────────────
function WaitingCaseDetail({
  c,
  decision,
  onDecision,
  onToggleArchive,
  onBack,
}: {
  c: CaseRecord
  decision: CaseDecision | undefined
  onDecision: (d: Decision, reason?: string) => void
  onToggleArchive: () => void
  onBack: () => void
}) {
  const { t } = useLanguage()
  const [tab, setTab] = useState('Overview')
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveRemark, setApproveRemark] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const decided = !!decision

  return (
    <div className="p-6 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        {t('backToWaiting')}
      </button>

      {/* Status banner */}
      <div className={`rounded-2xl p-5 flex items-center gap-4 ${decided ? (decision!.decision === 'Approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-amber-50 border border-amber-200'}`}>
        <span className="text-3xl">
          {decided ? (decision!.decision === 'Approved' ? '✅' : '❌') : '⏳'}
        </span>
        <div className="flex-1">
          <p className="font-bold text-gray-900">
            {decided ? `${t('decisionSubmitted')}: ${decision!.decision}` : t('awaitingFinalDecision')}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            {decided ? `${decision!.timestamp}` : t('decisionReturnedDesc')}
          </p>
          {decided && decision!.reason && (
            <p className="text-xs text-gray-500 mt-1 italic">Reason on record: "{decision!.reason}"</p>
          )}
        </div>

        {/* Archive toggle */}
        {decided && (
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-gray-600">{t('archiveToggleTitle')}</span>
              <button
                onClick={onToggleArchive}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1E4B8F] ${decision!.archive ? 'bg-[#1E4B8F]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${decision!.archive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {decision!.archive ? t('archiveOn') : t('archiveOff')}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!decided && (
        <div className="flex gap-3 flex-wrap">
          <Btn variant="success" onClick={() => setApproveOpen(true)} className="flex-1 min-w-[140px] py-3">
            {t('approveBtn')}
          </Btn>
          <Btn variant="danger" onClick={() => setRejectOpen(true)} className="flex-1 min-w-[140px] py-3">
            {t('rejectBtn')}
          </Btn>
        </div>
      )}

      {/* Case details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <p className="font-mono text-xs font-bold text-gray-400 mb-1">{c.id}</p>
          <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{c.subject}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
            <span className="text-xs text-gray-400">{c.date}</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span>📍</span>
            <span>{t('returnedFrom')} <strong className="text-gray-700">{c.directorate} → {c.group}</strong></span>
          </div>
        </div>

        <TabBar tabs={[t('tabOverview'), t('tabDocuments'), t('tabWorkflow'), t('tabRemarks')]} active={tab} onChange={setTab} />

        {tab === t('tabOverview') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('fieldCustomer')}</p>
              {[[t('fieldName'), c.customer], [t('fieldPhone'), c.customerPhone], [t('fieldEmail'), c.customerEmail], [t('fieldAddress'), c.customerAddress]].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">{l}</span>
                  <span className="text-sm text-gray-800 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('caseInformation')}</p>
              {[[t('fieldReference'), c.reference], [t('fieldSector'), c.sector], [t('fieldDirectorate'), c.directorate], [t('fieldGroup'), c.group]].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">{l}</span>
                  <span className="text-sm text-gray-800 font-medium font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === t('tabDocuments') && (
          <div className="space-y-3 mt-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{t('allDocuments')}</p>
            {c.documents.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors">
                <span className="text-xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs text-gray-400">{t('versionLabel')} {d.version} · {d.size} · {d.date}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{d.type}</span>
                <Btn variant="secondary" size="sm">{t('view')}</Btn>
              </div>
            ))}
          </div>
        )}

        {tab === t('tabWorkflow') && (
          <div className="max-w-sm mt-2">
            <CaseTimeline steps={c.timeline} />
          </div>
        )}

        {tab === t('tabRemarks') && (
          <div className="space-y-3 mt-2">
            {c.remarks.length === 0 && <p className="text-sm text-gray-400">No remarks recorded.</p>}
            {c.remarks.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-[#1E4B8F]/10 flex items-center justify-center text-xs font-bold text-[#1E4B8F]">{r.author[0]}</div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{r.author} · {r.role}</p>
                    <p className="text-xs text-gray-400">{r.timestamp}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve modal */}
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title={t('modal_approveCase')}>
        <div className="space-y-3">
          <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-green-800">{t('approvingLabel')} {c.id}</p>
              <p className="text-xs text-green-600">{c.subject}</p>
            </div>
          </div>
          <Textarea
            label={t('label_optRemark')}
            value={approveRemark}
            onChange={e => setApproveRemark(e.target.value)}
            placeholder={t('ph_closingRemark')}
          />
        </div>
        <div className="flex gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setApproveOpen(false)} className="flex-1">{t('cancel')}</Btn>
          <Btn variant="success" onClick={() => { onDecision('Approved', approveRemark || undefined); setApproveOpen(false) }} className="flex-1">
            {t('confirmApproval')}
          </Btn>
        </div>
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={t('modal_rejectCase')}>
        <div className="space-y-3">
          <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="text-sm font-bold text-red-800">{t('rejectingLabel')} {c.id}</p>
              <p className="text-xs text-red-600">{c.subject}</p>
            </div>
          </div>
          <Textarea
            label={t('label_reason')}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder={t('ph_rejectReason')}
          />
          <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
            <span>⚠️</span>
            <span>{t('customerVisible')}</span>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setRejectOpen(false)} className="flex-1">{t('cancel')}</Btn>
          <Btn variant="danger" disabled={!rejectReason.trim()} onClick={() => { onDecision('Rejected', rejectReason); setRejectOpen(false) }} className="flex-1">
            {t('confirmRejection')}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}

function ReportsTabs() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('Daily')
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <TabBar tabs={[t('daily'), t('monthly'), t('annual')]} active={tab} onChange={setTab} />
      {tab === t('daily') && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('todayLabel')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[[t('kpi_receivedToday'), '12'], [t('finalizedToday'), '8'], [t('kpi_rejected'), '2'], [t('currentlyActive'), '24']].map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{l}</p>
                <p className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{v}</p>
              </div>
            ))}
          </div>
          <BarChart data={CHART_DATA.slice(-2)} />
        </div>
      )}
      {tab === t('monthly') && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('augustLabel')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[[t('kpi_totalCases'), '184'], [t('finalizedToday'), '121'], [t('kpi_rejected'), '18'], [t('kpi_pending'), '45']].map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{l}</p>
                <p className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{v}</p>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 mb-1">{t('avgProcessingTime')}</p>
            <p className="text-3xl font-black text-[#1E4B8F]" style={{ fontFamily: 'var(--font-display)' }}>4.2 <span className="text-base font-semibold">{t('days')}</span></p>
          </div>
          <BarChart data={CHART_DATA} />
        </div>
      )}
      {tab === t('annual') && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('yearLabel')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[[t('kpi_totalCases'), '1,247'], [t('finalizedToday'), '891'], [t('kpi_rejected'), '134'], [t('avgProcessingTime'), '4.8']].map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{l}</p>
                <p className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{v}</p>
              </div>
            ))}
          </div>
          <BarChart data={CHART_DATA} />
        </div>
      )}
    </div>
  )
}

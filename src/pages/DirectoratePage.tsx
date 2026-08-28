import { useState } from 'react'
import { CASES } from '../data'
import { StatusBadge, KpiCard, Btn, EmptyState, PriorityBadge } from '../components/ui'
import { CaseDetail } from './RecordsPage'
import type { CaseRecord } from '../types'
import { useLanguage } from '../i18n'

interface Props {
  page: string
  setPage: (p: string) => void
}

const GROUPS = [
  { name: 'Group A1', active: 5, pending: 1, delayed: 0 },
  { name: 'Group A2', active: 3, pending: 1, delayed: 1 },
]

const TRANSFERS = [
  { from: 'Directorate A', to: 'Directorate B', case: 'FHC-2026-007', reason: 'Case falls under Directorate B scope', time: '1h ago' },
  { from: 'Group A2', to: 'Directorate A', case: 'FHC-2026-004', reason: 'Additional review needed', time: '4h ago' },
]

export default function DirectoratePage({ page, setPage }: Props) {
  const { t } = useLanguage()
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null)
  const [caseTab, setCaseTab] = useState('Overview')
  const [filterStatus, setFilterStatus] = useState('All')

  function openCase(c: CaseRecord) {
    setSelectedCase(c)
    setPage('case-detail')
    setCaseTab('Overview')
  }

  if (page === 'case-detail' && selectedCase) {
    return <CaseDetail c={selectedCase} tab={caseTab} setTab={setCaseTab} onBack={() => setPage('cases')} role="directorate" />
  }

  const dirCases = CASES.filter(c => c.directorate === 'Directorate A').filter(c => filterStatus === 'All' || c.status === filterStatus)

  if (page === 'groups') {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('groupOverview')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GROUPS.map(g => (
            <div key={g.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{g.name}</h3>
                {g.delayed > 0 && <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-semibold">⚠ {g.delayed} {t('delayed')}</span>}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[[t('active'), g.active], [t('kpi_pending'), g.pending], [t('delayed'), g.delayed]].map(([l, v]) => (
                  <div key={l as string} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">{l}</p>
                    <p className="text-xl font-black text-gray-900">{v}</p>
                  </div>
                ))}
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1E4B8F] rounded-full" style={{ width: `${(g.active / 8) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (page === 'transfers') {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('transfers')}</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {TRANSFERS.map((tr, i) => (
            <div key={i} className="px-6 py-4 flex items-start gap-4">
              <span className="text-xl mt-0.5">🔄</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{tr.from} → {tr.to}</p>
                <p className="text-xs text-[#1E4B8F] font-mono font-semibold">{tr.case}</p>
                <p className="text-xs text-gray-500 mt-1">{tr.reason}</p>
              </div>
              <span className="text-xs text-gray-400">{tr.time}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (page === 'dashboard') {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('directorateDashboard')}</h1>
          <p className="text-gray-500 text-sm">Directorate A · Housing Development Sector</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label={t('kpi_activeCases')} value={12} icon="🔄" onClick={() => setPage('cases')} />
          <KpiCard label={t('kpi_receivedToday')} value={5} icon="📥" accent="#2563EB" />
          <KpiCard label={t('kpi_pendingGroups')} value={3} icon="⏳" accent="#D97706" />
          <KpiCard label={t('kpi_returned')} value={2} icon="↩️" accent="#EA580C" />
          <KpiCard label={t('transferred')} value={1} icon="🔄" accent="#7C3AED" />
          <KpiCard label={t('delayed')} value={2} icon="⚠️" accent="#DC2626" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('casesNeedingAction')}</h2>
              <button onClick={() => setPage('cases')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('viewAll')}</button>
            </div>
            <div className="divide-y divide-gray-50">
              {CASES.filter(c => c.directorate === 'Directorate A').slice(0, 4).map(c => (
                <div key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openCase(c)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-semibold text-[#1E4B8F]">{c.id}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{c.subject}</p>
                  </div>
                  <Btn size="sm">{t('review')}</Btn>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('groupOverview')}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {GROUPS.map(g => (
                <div key={g.name} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-gray-800">{g.name}</p>
                    {g.delayed > 0 && <span className="text-xs text-red-600 font-semibold">⚠ {t('delayed')}</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span><strong className="text-gray-800">{g.active}</strong> {t('active')}</span>
                    <span><strong className="text-gray-800">{g.pending}</strong> {t('pendingDecision')}</span>
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

  const statuses = [t('filterAll'), 'New', 'Submitted', 'In Progress', 'Returned', 'Pending Clarification', 'Archived']
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('cases')}</h2>
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s === t('filterAll') ? 'All' : s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === (s === t('filterAll') ? 'All' : s) ? 'bg-[#1E4B8F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {dirCases.length === 0 ? <EmptyState icon="📁" title={t('empty_noCases')} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t('col_trackingNo'), t('col_subject'), t('col_status'), t('col_group'), t('col_priority'), t('col_lastActivity'), ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dirCases.map(c => (
                  <tr key={c.id} onClick={() => openCase(c)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#1E4B8F] text-xs">{c.id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[180px] truncate">{c.subject}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{c.group}</td>
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

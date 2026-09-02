import { useState, useEffect } from 'react'
import { getCases, type CaseItem } from '../api/cases.api'
import { mapCaseToRecord } from '../utils/caseMappers'
import { StatusBadge, KpiCard, Btn, EmptyState, PriorityBadge } from '../components/ui'
import { CaseDetail } from './RecordsPage'
import type { CaseRecord } from '../types'
import { useLanguage } from '../i18n'

interface Props {
  page: string
  setPage: (p: string) => void
}

export default function GroupPage({ page, setPage }: Props) {
  const { t } = useLanguage()
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null)
  const [caseTab, setCaseTab] = useState('Overview')
  const [filterStatus, setFilterStatus] = useState('All')
  const [cases, setCases] = useState<CaseItem[]>([])
const [loadingCases, setLoadingCases] = useState(true)
const [casesError, setCasesError] = useState('')

useEffect(() => {
  async function loadCases() {
    try {
      setLoadingCases(true)
      setCasesError('')

      const result = await getCases()
      setCases(result.data ?? [])
    } catch (err: any) {
      console.error('Failed to load group cases:', err)

      setCasesError(
        err.response?.data?.message || 'Failed to load cases.'
      )
    } finally {
      setLoadingCases(false)
    }
  }

  loadCases()
}, [])

  function openCase(c: CaseRecord) {
    setSelectedCase(c)
    setPage('case-detail')
    setCaseTab('Overview')
  }

  if (page === 'case-detail' && selectedCase) {
    return <CaseDetail c={selectedCase} tab={caseTab} setTab={setCaseTab} onBack={() => setPage('cases')} role="group" />
  }
  const groupCases = cases
  .map(mapCaseToRecord)
  .filter(c => c.group === 'Group A1')
  .filter(
    c => filterStatus === 'All' || c.status === filterStatus
  )
  //const groupCases = CASES.filter(c => c.group === 'Group A1').filter(c => filterStatus === 'All' || c.status === filterStatus)

  if (page === 'remarks') {
    const allRemarks = cases
  .map(mapCaseToRecord)
  .filter(c => c.group === 'Group A1')
  .flatMap(c =>
    c.remarks.map(r => ({
      ...r,
      caseId: c.id,
      subject: c.subject,
    }))
  )
    //const allRemarks = CASES.filter(c => c.group === 'Group A1').flatMap(c => c.remarks.map(r => ({ ...r, caseId: c.id, subject: c.subject })))
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('myRemarks')}</h2>
        <div className="space-y-3">
          {allRemarks.length === 0 ? <EmptyState icon="💬" title={t('empty_noRemarks')} sub={t('empty_noRemarksDesc')} /> : allRemarks.map((r, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#1E4B8F]/10 flex items-center justify-center text-xs font-bold text-[#1E4B8F]">{r.author[0]}</div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{r.author} — <span className="text-[#1E4B8F] font-mono">{r.caseId}</span></p>
                  <p className="text-xs text-gray-400">{r.timestamp}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">{r.content}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (page === 'delayed') {
    //const delayed = CASES.filter(c => c.group === 'Group A1' && c.status === 'Delayed')
    const delayed = cases
  .map(mapCaseToRecord)
  .filter(
    c => c.group === 'Group A1' && c.status === 'Delayed'
  )
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('kpi_delayed')}</h2>
        {delayed.length === 0 ? <EmptyState icon="✅" title={t('empty_noDelayed')} sub={t('empty_allOnTrack')} /> : delayed.map(c => (
          <div key={c.id} onClick={() => openCase(c)} className="bg-white rounded-xl border border-red-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs font-bold text-[#1E4B8F]">{c.id}</span>
              <StatusBadge status={c.status} />
            </div>
            <p className="font-semibold text-gray-900">{c.subject}</p>
            <p className="text-xs text-red-600 mt-1">⚠ 12 days in current stage</p>
          </div>
        ))}
      </div>
    )
  }

  if (page === 'dashboard') {
    const needsAction = cases
  .map(mapCaseToRecord)
  .filter(
    c =>
      c.group === 'Group A1' &&
      ['New', 'Returned', 'In Progress'].includes(c.status)
  )
    //const needsAction = CASES.filter(c => c.group === 'Group A1' && ['New', 'Returned', 'In Progress'].includes(c.status))
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('groupDashboard')}</h1>
          <p className="text-gray-500 text-sm">Group A1 · Directorate A · Housing Development Sector</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label={t('kpi_activeCases')} value={8} icon="📋" onClick={() => setPage('cases')} />
          <KpiCard label={t('kpi_newCases')} value={3} icon="🆕" accent="#2563EB" />
          <KpiCard label={t('kpi_pending')} value={2} icon="⏳" accent="#D97706" />
          <KpiCard label={t('kpi_returned')} value={2} icon="↩️" accent="#EA580C" />
          <KpiCard label={t('kpi_delayed')} value={1} icon="⚠️" accent="#DC2626" onClick={() => setPage('delayed')} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('casesNeedingAction')}</h2>
            <button onClick={() => setPage('cases')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('viewAll')}</button>
          </div>
          <div className="divide-y divide-gray-50">
            {needsAction.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openCase(c)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-semibold text-[#1E4B8F]">{c.id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{c.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Directorate A · {c.date}</p>
                </div>
                <Btn size="sm">
                  {c.status === 'New' ? t('open') : c.status === 'Returned' ? t('review') : t('continueBtn')}
                </Btn>
              </div>
            ))}
            {needsAction.length === 0 && <EmptyState icon="✅" title={t('empty_allOnTrack')} sub="" />}
          </div>
        </div>
      </div>
    )
  }

  const statuses = [t('filterAll'), 'New', 'In Progress', 'Pending Clarification', 'Returned', 'Archived']
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('myCases')}</h2>
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s === t('filterAll') ? 'All' : s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === (s === t('filterAll') ? 'All' : s) ? 'bg-[#1E4B8F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {groupCases.length === 0 ? <EmptyState icon="📁" title={t('empty_noCases')} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t('col_trackingNo'), t('col_subject'), t('col_status'), t('col_received'), t('col_priority'), ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupCases.map(c => (
                  <tr key={c.id} onClick={() => openCase(c)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#1E4B8F] text-xs">{c.id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[200px] truncate">{c.subject}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{c.date}</td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-5 py-3.5">
                      <button className="text-xs text-[#1E4B8F] font-semibold hover:underline">
                        {c.status === 'New' ? t('open') : c.status === 'Returned' ? t('review') : t('continueBtn')}
                      </button>
                    </td>
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

import { useState } from 'react'
import { CASES, SECTORS } from '../data'
import { StatusBadge, KpiCard, Btn, Modal, Input, Textarea, Select, TabBar, CaseTimeline, EmptyState, PriorityBadge } from '../components/ui'
import type { CaseRecord } from '../types'
import { useLanguage } from '../i18n'

interface Props {
  page: string
  setPage: (p: string) => void
}

export default function RecordsPage({ page, setPage }: Props) {
  const { t } = useLanguage()
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null)
  const [caseTab, setCaseTab] = useState('Overview')
  const [searchQ, setSearchQ] = useState('')

  function openCase(c: CaseRecord) {
    setSelectedCase(c)
    setPage('case-detail')
    setCaseTab('Overview')
  }

  if (page === 'register') return <RegisterCaseForm onSuccess={() => setPage('cases')} />
  if (page === 'case-detail' && selectedCase) return (
    <CaseDetail c={selectedCase} tab={caseTab} setTab={setCaseTab} onBack={() => setPage('cases')} role="records" />
  )

  const myCases = CASES.filter(c =>
    (page === 'archived' ? c.status === 'Archived' : page === 'registered' ? true : true) &&
    (c.subject.toLowerCase().includes(searchQ.toLowerCase()) || c.id.toLowerCase().includes(searchQ.toLowerCase()) || c.customer.toLowerCase().includes(searchQ.toLowerCase()))
  )

  if (page === 'documents') {
    return (
      <div className="p-6">
        <h2 className="text-xl font-black text-gray-900 mb-6" style={{ fontFamily: 'var(--font-display)' }}>{t('documents')}</h2>
        <div className="grid gap-4">
          {CASES.flatMap(c => c.documents.map(d => ({ ...d, caseId: c.id, subject: c.subject }))).map((d, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">📄</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                <p className="text-xs text-gray-400">Version {d.version} · {d.size} · {d.date} · {d.caseId}</p>
              </div>
              <Btn variant="secondary" size="sm">View</Btn>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (page === 'archive') {
    const archived = CASES.filter(c => c.status === 'Archived' || c.status === 'Approved' || c.status === 'Rejected')
    return (
      <div className="p-6">
        <h2 className="text-xl font-black text-gray-900 mb-6" style={{ fontFamily: 'var(--font-display)' }}>{t('archive')}</h2>
        <CasesTable cases={archived} onOpen={openCase} />
      </div>
    )
  }

  if (page === 'dashboard') {
    return (
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-[#1E4B8F] to-[#2558A8] rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-semibold mb-1">{t('goodMorning')}, Sara</p>
            <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)' }}>{t('recordsDashboard')}</h1>
            <p className="text-blue-200 text-sm mt-1">{t('todayIs')}</p>
          </div>
          <Btn onClick={() => setPage('register')} variant="secondary" size="lg" className="bg-white text-[#1E4B8F] border-0 font-black shadow-lg">
            ➕ Register New Case
          </Btn>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label={t('kpi_registeredToday')} value={5} icon="📋" sub="Aug 15, 2026" />
          <KpiCard label={t('kpi_totalActive')} value={18} icon="🔄" accent="#2563EB" />
          <KpiCard label={t('kpi_archivedCases')} value={2} icon="🗃" accent="#6B7280" />
          <KpiCard label={t('kpi_pendingUpload')} value={3} icon="⚠️" accent="#D97706" />
        </div>

        {/* Recent cases */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('recentlyRegistered')}</h2>
            <button onClick={() => setPage('cases')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('viewAll')}</button>
          </div>
          <CasesTable cases={CASES.slice(0, 5)} onOpen={openCase} />
        </div>
      </div>
    )
  }

  // Cases list
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          {page === 'archived' ? t('archivedCases') : page === 'registered' ? t('registeredCases') : t('allCases')}
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search…"
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20"
          />
          <Btn onClick={() => setPage('register')}>➕ {t('registerCase')}</Btn>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <CasesTable cases={myCases} onOpen={openCase} />
      </div>
    </div>
  )
}

// ── Cases Table ────────────────────────────────────────
function CasesTable({ cases, onOpen }: { cases: CaseRecord[]; onOpen: (c: CaseRecord) => void }) {
  const { t } = useLanguage()
  if (!cases.length) return <EmptyState icon="📁" title={t('empty_noCases')} sub={t('empty_noCasesDesc')} />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {[t('col_trackingNo'), t('col_subject'), t('col_customer'), t('col_sector'), t('col_status'), t('col_priority'), t('col_date'), ''].map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map(c => (
            <tr key={c.id} onClick={() => onOpen(c)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
              <td className="px-5 py-3.5 font-mono font-semibold text-[#1E4B8F] text-xs">{c.id}</td>
              <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[180px] truncate">{c.subject}</td>
              <td className="px-5 py-3.5 text-gray-600">{c.customer}</td>
              <td className="px-5 py-3.5 text-gray-500 text-xs">{c.sector}</td>
              <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
              <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
              <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">{c.date}</td>
              <td className="px-5 py-3.5">
                <button className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('view')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Register Case Form ─────────────────────────────────
function RegisterCaseForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage()
  const [step, setStep] = useState<1 | 2 | 3 | 'done'>(1)
  const [sector, setSector] = useState('')
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', subject: '', reference: '', priority: 'Normal', notes: '' })
  const generatedId = 'FHC-2026-' + String(CASES.length + 1).padStart(3, '0')

  function update(k: string, v: string) { setFormData(f => ({ ...f, [k]: v })) }

  if (step === 'done') {
    return (
      <div className="p-6 flex justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">✅</div>
          <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{t('caseRegisteredTitle')}</h2>
          <p className="text-gray-500 text-sm mb-4">{t('caseRegisteredDesc')}</p>
          <div className="bg-[#EEF4FF] rounded-xl p-4 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t('trackingNumber')}</p>
            <p className="text-2xl font-black text-[#1E4B8F] font-mono">{generatedId}</p>
            <p className="text-xs text-gray-500 mt-1">{t('assignedTo')} {sector}</p>
          </div>
          <div className="flex gap-3">
            <Btn onClick={() => { setStep(1); setSector(''); setFormData({ name: '', phone: '', email: '', address: '', subject: '', reference: '', priority: 'Normal', notes: '' }) }} variant="secondary" className="flex-1">{t('registerAnother')}</Btn>
            <Btn onClick={onSuccess} className="flex-1">{t('viewCases')}</Btn>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onSuccess} className="text-sm text-gray-500 hover:text-gray-700">←</button>
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('registerNewCaseTitle')}</h2>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[t('step_customerInfo'), t('step_caseDetails'), t('step_docsSector')].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-[#1E4B8F] text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-semibold ${step === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
            {i < 2 && <span className="text-gray-200 mx-1">—</span>}
          </div>
        ))}
      </div>

      <div className="max-w-xl">
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-800 mb-2">{t('customerInformation')}</h3>
            <Input label={t('label_fullName')} value={formData.name} onChange={e => update('name', e.target.value)} placeholder={t('ph_name')} />
            <Input label={t('label_phone')} value={formData.phone} onChange={e => update('phone', e.target.value)} placeholder={t('ph_phone')} />
            <Input label={t('label_email')} value={formData.email} onChange={e => update('email', e.target.value)} placeholder={t('ph_email')} type="email" />
            <Textarea label={t('label_address')} value={formData.address} onChange={e => update('address', e.target.value)} placeholder={t('ph_address')} rows={2} />
            <div className="flex justify-end pt-2">
              <Btn onClick={() => setStep(2)} disabled={!formData.name || !formData.phone}>{t('nextBtn')}</Btn>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-800 mb-2">{t('caseInformation')}</h3>
            <Input label={t('label_subject')} value={formData.subject} onChange={e => update('subject', e.target.value)} placeholder={t('ph_subject')} />
            <Input label={t('label_incomingRef')} value={formData.reference} onChange={e => update('reference', e.target.value)} placeholder={t('ph_ref')} />
            <Select
              label={t('label_priority')}
              value={formData.priority}
              onChange={e => update('priority', e.target.value)}
              options={[{ value: 'High', label: t('priority_High') }, { value: 'Normal', label: t('priority_Normal') }, { value: 'Low', label: t('priority_Low') }]}
            />
            <Textarea label={t('label_notes')} value={formData.notes} onChange={e => update('notes', e.target.value)} placeholder={t('ph_notes')} rows={3} />
            <div className="flex justify-between pt-2">
              <Btn variant="secondary" onClick={() => setStep(1)}>{t('backBtn')}</Btn>
              <Btn onClick={() => setStep(3)} disabled={!formData.subject || !formData.reference}>{t('nextBtn')}</Btn>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-800 mb-2">{t('step_docsSector')}</h3>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">{t('label_mainDoc')}</p>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#1E4B8F]/40 transition-colors cursor-pointer bg-gray-50">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-sm font-semibold text-gray-600">{t('uploadHint')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('uploadSub')}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">{t('label_attachments')}</p>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#1E4B8F]/40 transition-colors cursor-pointer bg-gray-50">
                <p className="text-sm text-gray-500">{t('uploadMore')}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">{t('label_selectSector')}</p>
              <div className="space-y-2">
                {SECTORS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSector(s)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${sector === s ? 'border-[#1E4B8F] bg-[#EEF4FF] text-[#1E4B8F]' : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Btn variant="secondary" onClick={() => setStep(2)}>{t('backBtn')}</Btn>
              <Btn onClick={() => setStep('done')} disabled={!sector} variant="success">
                ✓ {t('registerCase')}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Case Detail (shared across roles) ─────────────────
export function CaseDetail({ c, tab, setTab, onBack, role }: { c: CaseRecord; tab: string; setTab: (t: string) => void; onBack: () => void; role: string }) {
  const { t } = useLanguage()
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [remarkText, setRemarkText] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [workSummary, setWorkSummary] = useState('')

  const tabs = [t('tabOverview'), t('tabDocuments'), t('tabWorkflow'), t('tabRemarks')]

  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        {t('backToCases')}
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold text-gray-400 mb-1">{c.id}</p>
            <h1 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>{c.subject}</h1>
            <div className="flex items-center flex-wrap gap-2">
              <StatusBadge status={c.status} />
              <PriorityBadge priority={c.priority} />
              <span className="text-xs text-gray-400">{t('fieldRegistered')} {c.date}</span>
            </div>
          </div>
          {/* Action buttons per role */}
          <div className="flex gap-2 flex-wrap justify-end">
            {role === 'sector' && (
              <>
                {(c.status === 'New' || c.status === 'Submitted') && (
                  <Btn size="sm" onClick={() => setAssignOpen(true)}>{t('modal_assignDir')}</Btn>
                )}
                {c.status === 'In Progress' && (
                  <>
                    <Btn size="sm" variant="success" onClick={() => setApproveOpen(true)}>✓ {t('approve')}</Btn>
                    <Btn size="sm" variant="danger" onClick={() => setRejectOpen(true)}>✕ {t('reject')}</Btn>
                    <Btn size="sm" variant="secondary" onClick={() => setReturnOpen(true)}>↩ {t('return')}</Btn>
                  </>
                )}
              </>
            )}
            {role === 'directorate' && (
              <>
                {(c.status === 'New' || c.status === 'Submitted' || c.status === 'In Progress') && (
                  <Btn size="sm" onClick={() => setAssignOpen(true)}>{t('modal_assignGroup')}</Btn>
                )}
                <Btn size="sm" variant="secondary" onClick={() => setReturnOpen(true)}>↩ {t('sendToDirectorate')}</Btn>
              </>
            )}
            {role === 'group' && (
              <>
                {c.status === 'In Progress' && (
                  <Btn size="sm" variant="success" onClick={() => setApproveOpen(true)}>✓ {t('completeWork')}</Btn>
                )}
                {c.status === 'New' && (
                  <Btn size="sm" onClick={() => setApproveOpen(true)}>▶ {t('startWork')}</Btn>
                )}
                <Btn size="sm" variant="secondary" onClick={() => setReturnOpen(true)}>↩ {t('sendToDirectorate')}</Btn>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <span>📍</span>
          <span>{t('currentLocation')} <strong className="text-gray-700">{c.directorate} → {c.group}</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />

        {tab === t('tabOverview') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Section title={t('customerInformation')}>
                <Row label={t('fieldName')} val={c.customer} />
                <Row label={t('fieldPhone')} val={c.customerPhone} mono />
                <Row label={t('fieldEmail')} val={c.customerEmail} />
                <Row label={t('fieldAddress')} val={c.customerAddress} />
              </Section>
            </div>
            <div className="space-y-4">
              <Section title={t('caseInformation')}>
                <Row label={t('col_trackingNo')} val={c.id} mono />
                <Row label={t('fieldReference')} val={c.reference} mono />
                <Row label={t('fieldSector')} val={c.sector} />
                <Row label={t('fieldDirectorate')} val={c.directorate} />
                <Row label={t('fieldGroup')} val={c.group} />
                <Row label={t('fieldRegistered')} val={c.date} />
                <Row label={t('fieldLastActivity')} val={c.lastActivity} />
              </Section>
            </div>
          </div>
        )}

        {tab === t('tabDocuments') && (
          <div className="space-y-3">
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{t('mainDocument')}</p>
              {c.documents.filter(d => d.type === 'main').map((d, i) => (
                <DocRow key={i} doc={d} />
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{t('attachmentsLabel')}</p>
              {c.documents.filter(d => d.type === 'attachment').map((d, i) => (
                <DocRow key={i} doc={d} />
              ))}
            </div>
            <div className="pt-3">
              <Btn variant="secondary" size="sm">+ {t('uploadDoc')}</Btn>
            </div>
          </div>
        )}

        {tab === t('tabWorkflow') && (
          <div className="max-w-sm">
            <CaseTimeline steps={c.timeline} />
          </div>
        )}

        {tab === t('tabRemarks') && (
          <div className="space-y-4">
            {c.remarks.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-[#1E4B8F]/10 flex items-center justify-center text-xs font-bold text-[#1E4B8F]">{r.author[0]}</div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{r.author}</p>
                    <p className="text-xs text-gray-400">{r.timestamp}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{r.content}</p>
              </div>
            ))}
            <div className="pt-2 space-y-2">
              <textarea
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                placeholder={t('ph_closingRemark')}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20 resize-none"
              />
              <Btn size="sm" disabled={!remarkText}>{t('addRemark')}</Btn>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title={role === 'group' ? t('modal_completeWork') : t('modal_approveCase')}>
        <Textarea label={role === 'group' ? t('label_workSummary') : t('label_optRemark')} value={workSummary} onChange={e => setWorkSummary(e.target.value)} placeholder={role === 'group' ? t('ph_workSummary') : t('ph_closingRemark')} />
        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" onClick={() => setApproveOpen(false)} className="flex-1">{t('cancel')}</Btn>
          <Btn variant="success" onClick={() => setApproveOpen(false)} className="flex-1">{role === 'group' ? t('completeWork') : t('confirmApproval')}</Btn>
        </div>
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={t('modal_rejectCase')}>
        <div className="space-y-3">
          <Textarea label={t('label_reason')} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={t('ph_rejectReason')} />
          <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
            <span>⚠️</span>
            <span>{t('customerVisible')}</span>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" onClick={() => setRejectOpen(false)} className="flex-1">{t('cancel')}</Btn>
          <Btn variant="danger" disabled={!rejectReason} onClick={() => setRejectOpen(false)} className="flex-1">{t('confirmRejection')}</Btn>
        </div>
      </Modal>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={role === 'directorate' ? t('modal_assignGroup') : t('modal_assignDir')}>
        <p className="text-sm text-gray-600 mb-4">Case: <span className="font-mono font-semibold">{c.id}</span></p>
        <Select
          label={role === 'directorate' ? t('label_selectGroup') : t('label_selectDir')}
          options={role === 'directorate'
            ? [{ value: 'Group A1', label: 'Group A1' }, { value: 'Group A2', label: 'Group A2' }]
            : [{ value: 'Directorate A', label: 'Directorate A' }, { value: 'Directorate B', label: 'Directorate B' }, { value: 'Directorate C', label: 'Directorate C' }]
          }
        />
        <Textarea label={t('label_optInstructions')} placeholder={t('ph_instructions')} className="mt-3" />
        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" onClick={() => setAssignOpen(false)} className="flex-1">{t('cancel')}</Btn>
          <Btn onClick={() => setAssignOpen(false)} className="flex-1">{t('assign')}</Btn>
        </div>
      </Modal>

      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title={t('modal_returnCase')}>
        <p className="text-sm text-gray-600 mb-4">Case: <span className="font-mono font-semibold">{c.id}</span></p>
        <Textarea label={t('label_reason')} placeholder={t('ph_returnReason')} />
        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" onClick={() => setReturnOpen(false)} className="flex-1">{t('cancel')}</Btn>
          <Btn variant="secondary" onClick={() => setReturnOpen(false)} className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50">↩ {t('return')}</Btn>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function Row({ label, val, mono = false }: { label: string; val: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-gray-800 font-medium ${mono ? 'font-mono' : ''}`}>{val}</span>
    </div>
  )
}

function DocRow({ doc }: { doc: { name: string; size: string; date: string; version: number } }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors">
      <span className="text-xl">📄</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
        <p className="text-xs text-gray-400">Version {doc.version} · {doc.size} · {doc.date}</p>
      </div>
      <Btn variant="secondary" size="sm">View</Btn>
    </div>
  )
}

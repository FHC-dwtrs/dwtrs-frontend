import { useState } from 'react'
import { trackCase, type PublicTrackingResult } from '../api/public.api'
import { StatusBadge } from '../components/ui'
import { useLanguage, LangToggle } from '../i18n'

interface Props {
  onGoLogin: () => void
}

function formatStatusLabel(status: string): string {
  const map: Record<string, string> = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'In Progress',
    IN_PROGRESS: 'In Progress',
    PENDING_CLARIFICATION: 'Pending Clarification',
    SENT_BACK_FOR_CORRECTION: 'Returned',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    COMPLETED: 'Approved',
    ARCHIVED: 'Archived',
  }
  return map[status] ?? status
}

export default function PublicPage({ onGoLogin }: Props) {
  const { t } = useLanguage()
  const [trackingInput, setTrackingInput] = useState('')
  const [result, setResult] = useState<PublicTrackingResult | 'not-found' | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleTrack() {
    if (!trackingInput.trim()) return

    setLoading(true)

    try {
      const response = await trackCase(trackingInput.trim())
      setResult(response.data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setResult('not-found')
      } else {
        console.error('Failed to track case:', err)
        setResult('not-found')
      }
    } finally {
      setLoading(false)
    }
  }

  function publicStatusMessage(status: string) {
    const key = `statusMsg_${formatStatusLabel(status).replace(/ /g, '')}` as Parameters<typeof t>[0]
    return t(key) || t('statusMsg_New')
  }

  const progressStages = (status: string) => {
    const label = formatStatusLabel(status)
    return [
      { label: t('progressReceived'), done: true },
      { label: t('progressReview'), done: !['Submitted'].includes(label) },
      { label: t('progressProcessed'), done: ['Approved', 'Rejected', 'Archived'].includes(label) },
      { label: t('progressDecision'), done: ['Approved', 'Rejected', 'Archived'].includes(label) },
    ]
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1E4B8F] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm" style={{ fontFamily: 'var(--font-display)' }}>F</span>
            </div>
            <div>
              <p className="font-black text-[#1E4B8F] text-sm leading-none" style={{ fontFamily: 'var(--font-display)' }}>{t('appName')}</p>
              <p className="text-xs text-gray-400 leading-none mt-0.5">{t('appFull')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle className="border-gray-200 text-gray-600 hover:border-[#1E4B8F] hover:text-[#1E4B8F] bg-white" />
            <button
              onClick={onGoLogin}
              className="text-sm text-[#1E4B8F] font-semibold hover:underline whitespace-nowrap"
            >
              {t('staffLogin')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Tracker */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        {!result ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#1E4B8F]/8 text-[#1E4B8F] text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-[#1E4B8F]" />
              {t('orgName')}
            </div>

            <h1 className="text-4xl font-black text-gray-900 mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {t('trackYourApplication')}
            </h1>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              {t('trackingSubtitle')}
            </p>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-left">
                {t('trackingNumber')}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={e => setTrackingInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTrack()}
                  placeholder="e.g. FHC-1788128173309"
                  className="flex-1 px-4 py-3.5 rounded-xl border-2 border-gray-200 text-gray-900 font-mono text-base placeholder-gray-300 focus:outline-none focus:border-[#1E4B8F] focus:ring-4 focus:ring-[#1E4B8F]/10 transition-all"
                />
                <button
                  onClick={handleTrack}
                  disabled={loading || !trackingInput.trim()}
                  className="px-6 py-3.5 bg-[#1E4B8F] text-white font-bold rounded-xl hover:bg-[#163872] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-w-[120px] justify-center"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>🔍 {t('trackCase')}</>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-12">
              {[
                { icon: '🔒', label: t('secure'), desc: t('secureDesc') },
                { icon: '⚡', label: t('realTime'), desc: t('realTimeDesc') },
                { icon: '📱', label: t('easyAccess'), desc: t('easyAccessDesc') },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="text-sm font-semibold text-gray-700">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : result === 'not-found' ? (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">🔍</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{t('caseNotFound')}</h2>
              <p className="text-gray-500 text-sm mb-6">
                {t('caseNotFoundDesc')} <span className="font-mono font-semibold text-gray-700">"{trackingInput}"</span>.{' '}
                {t('checkAndRetry')}
              </p>
              <button
                onClick={() => { setResult(null); setTrackingInput('') }}
                className="px-6 py-2.5 bg-[#1E4B8F] text-white font-semibold rounded-xl hover:bg-[#163872] transition-colors"
              >
                {t('tryAgain')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => { setResult(null); setTrackingInput('') }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              {t('trackAnotherCase')}
            </button>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className={`px-8 py-6 ${result.status === 'APPROVED' || result.status === 'COMPLETED' ? 'bg-green-50 border-b border-green-100' : result.status === 'REJECTED' ? 'bg-red-50 border-b border-red-100' : 'bg-[#1E4B8F]/4 border-b border-[#1E4B8F]/10'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('trackingNumber')}</p>
                    <p className="text-xl font-black text-gray-900 font-mono mb-3" style={{ fontFamily: 'var(--font-display)' }}>{result.trackingNumber}</p>
                    <StatusBadge status={formatStatusLabel(result.status) as any} />
                  </div>
                  <div className="text-4xl">
                    {result.status === 'APPROVED' || result.status === 'COMPLETED' ? '✅' : result.status === 'REJECTED' ? '❌' : result.status === 'ARCHIVED' ? '🗃' : '⏳'}
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-1">{result.subject}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{publicStatusMessage(result.status)}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">{t('applicationProgress')}</p>
                  <div className="flex items-center gap-0">
                    {progressStages(result.status).map((stage, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${stage.done ? 'bg-[#1E4B8F] text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {stage.done ? '✓' : idx + 1}
                        </div>
                        <p className="text-xs text-center text-gray-500 leading-tight px-1">{stage.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{t('dateSubmitted')}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">
                      {new Date(result.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{t('lastUpdated')}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">
                      {new Date(result.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                  <strong>{t('needHelp')}</strong> {t('contactNote')} <span className="font-mono">info@fhc.gov.et</span> {t('contactOr')} <span className="font-mono">+251 11 XXX XXXX</span> {t('quotingNumber')}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
          <p>{t('copyright')}</p>
          <p>{t('version')}</p>
        </div>
      </footer>
    </div>
  )
}
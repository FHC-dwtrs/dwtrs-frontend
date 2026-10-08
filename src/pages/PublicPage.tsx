import { useState } from 'react'
import { trackCase, type PublicTrackingResult } from '../api/public.api'
import { StatusBadge } from '../components/ui'
import { useLanguage, LangToggle } from '../i18n'
import logo from '../assets/fhc-logo.png'
import fhcPhoto from '../assets/fhc-login-bg.png'

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
    <div className="min-h-screen bg-[#F7F9FA]">
      {/* ── Hero ─────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#416A7A] via-[#416A7A] to-[#2B4C58] text-white">
        {/* photo texture + tint */}
        <img src={fhcPhoto} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.16]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#416A7A]/60 via-[#416A7A]/80 to-[#416A7A]/95" />

        {/* concentric rings */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute border border-white rounded-full" style={{
              width: (i + 1) * 170, height: (i + 1) * 170,
              top: '55%', left: '50%', transform: 'translate(-50%,-50%)',
            }} />
          ))}
        </div>

        {/* glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#5F8A72]/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-16 w-[26rem] h-[26rem] rounded-full bg-[#EAF1F3]/20 blur-3xl pointer-events-none" />

        {/* nav */}
        <div className="relative max-w-5xl mx-auto px-6 pt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg overflow-hidden ring-1 ring-white/40 flex-shrink-0">
              <img src={logo} alt="FHC" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-none" style={{ fontFamily: 'var(--font-display)' }}>{t('orgName')}</p>
              <p className="text-xs text-blue-100 leading-none mt-1 hidden sm:block">{t('appFull')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle className="border-white/30 text-white hover:border-white hover:bg-white/10" />
            <button
              onClick={onGoLogin}
              className="px-4 py-2 bg-white text-[#416A7A] text-sm font-bold rounded-lg shadow-sm hover:bg-[#EAF1F3] transition-colors whitespace-nowrap"
            >
              {t('staffLogin')}
            </button>
          </div>
        </div>

        {/* hero copy */}
        <div className="relative max-w-2xl mx-auto px-6 pt-12 sm:pt-16 pb-28 text-center animate-[fadeUp_0.6s_ease-out_both]">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {t('trackYourApplication')}
          </h1>
          <p className="text-blue-100 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            {t('trackingSubtitle')}
          </p>
        </div>
      </header>

      {/* ── Content (overlaps hero) ───────────────────────── */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 -mt-16 pb-16">
        {!result ? (
          <div>
            <div className="bg-white rounded-2xl shadow-xl shadow-[#416A7A]/10 border border-[#E6EAED] p-7 sm:p-8 animate-[fadeUp_0.6s_ease-out_0.15s_both]">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-left">
                {t('trackingNumber')}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={e => setTrackingInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTrack()}
                  placeholder="e.g. FHC-1788128173309"
                  className="flex-1 w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 font-mono text-base placeholder-gray-300 focus:outline-none focus:border-[#416A7A] focus:bg-white focus:ring-4 focus:ring-[#416A7A]/10 transition-all"
                />
                <button
                  onClick={handleTrack}
                  disabled={loading || !trackingInput.trim()}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#416A7A] text-white font-bold rounded-xl hover:bg-[#345A68] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 sm:min-w-[140px] justify-center shadow-md shadow-[#416A7A]/25"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>🔍 {t('trackCase')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : result === 'not-found' ? (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-xl shadow-[#416A7A]/10 border border-[#E6EAED] p-10 animate-[fadeUp_0.6s_ease-out_both]">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">🔍</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{t('caseNotFound')}</h2>
              <p className="text-gray-500 text-sm mb-6">
                {t('caseNotFoundDesc')} <span className="font-mono font-semibold text-gray-700">"{trackingInput}"</span>.{' '}
                {t('checkAndRetry')}
              </p>
              <button
                onClick={() => { setResult(null); setTrackingInput('') }}
                className="px-6 py-2.5 bg-[#416A7A] text-white font-semibold rounded-xl hover:bg-[#345A68] transition-colors"
              >
                {t('tryAgain')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => { setResult(null); setTrackingInput('') }}
              className="flex items-center gap-1.5 text-sm font-semibold text-white/85 hover:text-white mb-6 transition-colors"
            >
              ← {t('trackAnotherCase')}
            </button>

            <div className="bg-white rounded-2xl shadow-xl shadow-[#416A7A]/10 border border-[#E6EAED] overflow-hidden animate-[fadeUp_0.6s_ease-out_both]">
              <div className={`px-8 py-6 ${result.status === 'APPROVED' || result.status === 'COMPLETED' ? 'bg-green-50 border-b border-green-100' : result.status === 'REJECTED' ? 'bg-red-50 border-b border-red-100' : 'bg-[#416A7A]/4 border-b border-[#416A7A]/10'}`}>
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${stage.done ? 'bg-[#416A7A] text-white' : 'bg-gray-200 text-gray-400'}`}>
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
    </div>
  )
}
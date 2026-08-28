import { useState } from 'react'
import type { AuthUser, Role } from '../types'
import { login } from '../api/auth.api'
import { useLanguage, LangToggle } from '../i18n'

interface Props {
  onLogin: (user: AuthUser) => void
  onBack: () => void
}

export default function LoginPage({ onLogin, onBack }: Props) {
  const { t, lang } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
  
    if (!email || !password) {
      setError(t('invalidCredentials'))
      return
    }
  
    setLoading(true)
    setError('')
  
    try {
      const response = await login({
        email,
        password,
      })
  
      localStorage.setItem('dwtrs_token', response.data.token)
  
      onLogin(response.data.user)
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError(t('invalidCredentials'))
      } else if (error.response?.status === 400) {
        setError('Please enter a valid email and password.')
      } else {
        setError('Unable to connect to the server. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      {/* ── Left branding panel ─────────────────────────────── */}
      <div className="hidden lg:flex w-[42%] bg-[#1E4B8F] text-white flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-[0.04]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="absolute border border-white rounded-full" style={{
              width: (i + 1) * 140, height: (i + 1) * 140,
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            }} />
          ))}
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center font-black text-xl">F</div>
            <div>
              <p className="font-black text-xl leading-none" style={{ fontFamily: 'var(--font-display)' }}>{t('appName')}</p>
              <p className="text-blue-200 text-xs mt-0.5">{t('appFull')}</p>
            </div>
          </div>

          <h1 className="text-4xl font-black leading-tight mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            {t('brandingTagline')}
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            {t('brandingDesc')}
          </p>
        </div>

        <div className="relative space-y-3.5">
          {[
            { icon: '📋', key: 'feature1' as const },
            { icon: '🏢', key: 'feature2' as const },
            { icon: '🔄', key: 'feature3' as const },
            { icon: '🔐', key: 'feature4' as const },
          ].map(f => (
            <div key={f.key} className="flex items-center gap-3 text-sm text-blue-100">
              <span className="text-base">{f.icon}</span>
              {t(f.key)}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right login panel ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col justify-start p-8 lg:p-12 max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              {t('publicPortalBack')}
            </button>
            <LangToggle className="border-gray-200 text-gray-600 hover:border-[#1E4B8F] hover:text-[#1E4B8F] bg-white" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>{t('staffLoginTitle')}</h2>
          <p className="text-gray-500 text-sm mb-7">{t('staffLoginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-3.5 mb-8">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
              <input
                  type="text"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder={lang === 'am' ? 'የተጠቃሚ ስምዎን ያስገቡ' : 'Enter your Email'}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#1E4B8F] focus:ring-4 focus:ring-[#1E4B8F]/10 transition-all"
                />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t('password')}</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder={lang === 'am' ? 'የይለፍ ቃልዎን ያስገቡ' : 'Enter your password'}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#1E4B8F] focus:ring-4 focus:ring-[#1E4B8F]/10 transition-all" />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#1E4B8F] text-white font-bold rounded-xl hover:bg-[#163872] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : t('signIn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

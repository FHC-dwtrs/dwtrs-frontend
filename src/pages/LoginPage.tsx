import { useState } from 'react'
import type { AuthUser, Role } from '../types'
import { login } from '../api/auth.api'
import { useLanguage, LangToggle } from '../i18n'
import fhcPhoto from '../assets/fhc-login-bg.png'
import fhcLogo from '../assets/fhc-logo.png'

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
    <div className="min-h-screen bg-[#F7F9FA] flex relative overflow-hidden">
      {/* ── Transparent FHC photo background ────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={fhcPhoto}
          alt=""
          className="w-full h-full object-cover opacity-[0.22] animate-[bgDrift_36s_ease-in-out_infinite_alternate]"
        />
        {/* wash so the photo reads as a faint, transparent backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7F9FA]/85 via-[#F7F9FA]/78 to-[#EAF1F3]/70" />
        {/* soft primary glow */}
        <div className="absolute -top-40 -right-40 w-[34rem] h-[34rem] rounded-full bg-[#EAF1F3] blur-3xl opacity-80" />
        <div className="absolute -bottom-48 left-[30%] w-[28rem] h-[28rem] rounded-full bg-[#EDF4F1] blur-3xl opacity-60" />
      </div>

      {/* ── Left branding panel ─────────────────────────────── */}
      <div className="hidden lg:flex w-[42%] bg-[#416A7A] text-white flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        {/* photo texture, tinted into the brand color */}
        <img src={fhcPhoto} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#416A7A]/85 via-[#416A7A]/80 to-[#2B4C58]/90" />

        <div className="absolute inset-0 opacity-[0.04]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="absolute border border-white rounded-full" style={{
              width: (i + 1) * 140, height: (i + 1) * 140,
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            }} />
          ))}
        </div>

        <div className="relative animate-[fadeUp_0.6s_ease-out_both]">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 bg-white rounded-xl overflow-hidden ring-1 ring-white/30 flex-shrink-0">
              <img src={fhcLogo} alt="FHC" className="w-full h-full object-cover" />
            </div>
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

        <div className="relative space-y-3.5 animate-[fadeUp_0.6s_ease-out_0.2s_both]">
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
        <div className="flex-1 flex flex-col justify-start p-8 lg:p-12 max-w-xl mx-auto w-full animate-[fadeUp_0.6s_ease-out_0.1s_both]">
          <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              {t('publicPortalBack')}
            </button>
            <LangToggle className="border-gray-200 text-gray-600 hover:border-[#416A7A] hover:text-[#416A7A] bg-white" />
          </div>

          {/* Mobile branding (left logo panel is hidden below lg) */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-11 h-11 bg-white rounded-xl overflow-hidden ring-1 ring-gray-200 flex-shrink-0">
              <img src={fhcLogo} alt="FHC" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-black text-base leading-none text-[#416A7A]" style={{ fontFamily: 'var(--font-display)' }}>{t('appName')}</p>
              <p className="text-xs text-gray-400 leading-none mt-1">{t('appFull')}</p>
            </div>
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:border-[#416A7A] focus:ring-4 focus:ring-[#416A7A]/10 transition-all"
                />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t('password')}</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder={lang === 'am' ? 'የይለፍ ቃልዎን ያስገቡ' : 'Enter your password'}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:border-[#416A7A] focus:ring-4 focus:ring-[#416A7A]/10 transition-all" />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#416A7A] text-white font-bold rounded-xl hover:bg-[#345A68] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
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

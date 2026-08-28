import { useState } from 'react'
import type { Role } from '../types'
import { useLanguage, LangToggle } from '../i18n'

interface Props {
  onLogin: (role: Role, unit?: string) => void
  onBack: () => void
}

interface DemoAccount {
  role: Role
  label: string
  labelAm?: string
  user: string
  unit: string
  icon: string
  desc: string
  descAm?: string
  group?: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'records',
    label: 'Records & Archive',
    user: 'sara.h',
    unit: 'Records & Archive',
    icon: '🗃',
    desc: 'Register cases, upload documents, select sector',
    descAm: 'ጉዳዮችን ምዝገባ፣ ሰነዶች ሰቀላ፣ ዘርፍ ምረጥ',
    group: 'Support',
  },
  {
    role: 'sector',
    label: 'Housing Development Sector',
    labelAm: 'ለቤት ልማት ዘርፍ ም/ዋ/ሥ.አ',
    user: 'yonas.t',
    unit: 'Housing Development Sector',
    icon: '🏠',
    desc: 'Assign directorates, approve or reject cases for housing development',
    descAm: 'ዳይሬክቶሬቶችን ምደብ፣ ጉዳዮችን አጽድቅ ወይም ውድቅ ያድርግ',
    group: 'Sectors',
  },
  {
    role: 'sector',
    label: 'Corporate Service Sector',
    labelAm: 'ለኮርፖሬት ሲርቪስ ዘርፍ ም/ዋ/ሥ.አ',
    user: 'hana.g',
    unit: 'Corporate Service Sector',
    icon: '💼',
    desc: 'Manage corporate service cases, assign directorates, make final rulings',
    descAm: 'የድርጅት አገልግሎት ጉዳዮችን ያስተዳድሩ፣ ዳይሬክቶሬቶችን ምደብ',
    group: 'Sectors',
  },
  {
    role: 'sector',
    label: 'Houses Administration Sector',
    labelAm: 'ለቤቶች አስተዳደር ዘርፍ ም/ዋ/ሥ.አ',
    user: 'almaz.b',
    unit: 'Houses Administration Sector',
    icon: '🏛',
    desc: 'Handle house administration cases, transfers, and final decisions',
    descAm: 'የቤቶች አስተዳደር ጉዳዮችን ያስኬዱ፣ ዝውውሮች እና የመጨረሻ ውሳኔዎች',
    group: 'Sectors',
  },
  {
    role: 'sector',
    label: 'Construction Input Supply Sector',
    labelAm: 'ለኮንስትራክሽን ግብዓት አቅርቦት ዘርፍ ም/ዋ/ሥ.አ',
    user: 'fekadu.w',
    unit: 'Construction Input Supply Sector',
    icon: '🏗',
    desc: 'Oversee construction supply cases from intake to final decision',
    descAm: 'የኮንስትራክሽን ጉዳዮችን ከምዝገባ እስከ የመጨረሻ ውሳኔ ይቆጣጠሩ',
    group: 'Sectors',
  },
  {
    role: 'directorate',
    label: 'Directorate Officer',
    user: 'meron.a',
    unit: 'Directorate A — Housing Development',
    icon: '🏢',
    desc: 'Assign to groups, transfer cases, review outcomes',
    descAm: 'ለቡድኖች ምደብ፣ ጉዳዮች ዝውውር፣ ውጤቶች ግምገማ',
    group: 'Other Roles',
  },
  {
    role: 'group',
    label: 'Group Officer',
    user: 'daniel.g',
    unit: 'Group A1 — Directorate A',
    icon: '👥',
    desc: 'Process assigned cases, add remarks, complete work',
    descAm: 'የተመደቡ ጉዳዮችን ያሠሩ፣ አስተያየት ጨምሩ፣ ሥራ ጨርሱ',
    group: 'Other Roles',
  },
  {
    role: 'admin',
    label: 'System Administrator',
    user: 'admin',
    unit: 'System Administration',
    icon: '⚙️',
    desc: 'Manage users, organization, permissions, audit logs',
    descAm: 'ተጠቃሚዎችን፣ ድርጅትን፣ ፈቃዶችን እና ምርመራ መዝገቦችን ያስተዳድሩ',
    group: 'Other Roles',
  },
]

const GROUPS = ['Support', 'Sectors', 'Other Roles']
const USERS_MAP: Record<string, DemoAccount> = Object.fromEntries(DEMO_ACCOUNTS.map(a => [a.user, a]))

export default function LoginPage({ onLogin, onBack }: Props) {
  const { t, lang } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function doLogin(account: DemoAccount) {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin(account.role, account.unit)
    }, 380)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const account = USERS_MAP[username]
    if (account && password === 'demo123') {
      doLogin(account)
    } else {
      setError(t('invalidCredentials'))
    }
  }

  const groupLabel: Record<string, string> = {
    Support: t('groupSupport'),
    Sectors: t('groupSectors'),
    'Other Roles': t('groupOtherRoles'),
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
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t('username')}</label>
              <input type="text" value={username} onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder={lang === 'am' ? 'የተጠቃሚ ስምዎን ያስገቡ' : 'Enter your username'}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#1E4B8F] focus:ring-4 focus:ring-[#1E4B8F]/10 transition-all" />
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

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <p className="text-xs text-gray-400 font-medium whitespace-nowrap">{t('demoAccountsLabel')}</p>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="space-y-5">
            {GROUPS.map(grp => {
              const accounts = DEMO_ACCOUNTS.filter(a => a.group === grp)
              return (
                <div key={grp}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{groupLabel[grp]}</p>
                  <div className="space-y-1.5">
                    {accounts.map(a => (
                      <button
                        key={a.user}
                        onClick={() => doLogin(a)}
                        disabled={loading}
                        className="w-full flex items-start gap-3 px-4 py-3.5 bg-white rounded-xl border border-gray-200 hover:border-[#1E4B8F]/50 hover:bg-[#EEF4FF] transition-all text-left group disabled:opacity-60"
                      >
                        <div className="w-9 h-9 bg-[#F7F8FA] rounded-lg flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-white transition-colors mt-0.5">
                          {a.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-tight">{a.label}</p>
                          {a.labelAm && (
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{a.labelAm}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{lang === 'am' && a.descAm ? a.descAm : a.desc}</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-[#1E4B8F] transition-colors mt-1 flex-shrink-0">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

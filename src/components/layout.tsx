import { useState } from 'react'
import type { Role } from '../types'
import { useLanguage, LangToggle, type TKey } from '../i18n'

// ── Sidebar config per role ────────────────────────────
type NavItem = { labelKey: TKey; icon: string; page: string; children?: NavItem[] }

const NAV: Record<Role, NavItem[]> = {
  records: [
    { labelKey: 'dashboard', icon: '🏠', page: 'dashboard' },
    { labelKey: 'cases', icon: '📁', page: 'cases', children: [
      { labelKey: 'allCases', icon: '', page: 'cases' },
      { labelKey: 'registeredCases', icon: '', page: 'registered' },
      //{ labelKey: 'archivedCases', icon: '', page: 'archived' },
      { labelKey: 'returned', icon: '', page: 'returned' },
    ]},
   // { labelKey: 'returned', icon: '↩️', page: 'returned' }, 
    { labelKey: 'registerNewCase', icon: '➕', page: 'register' },
   // { labelKey: 'documents', icon: '📄', page: 'documents' },
    //{ labelKey: 'archive', icon: '🗃', page: 'archive' },
    { labelKey: 'notifications', icon: '🔔', page: 'notifications' },
  ],
  sector: [
    { labelKey: 'dashboard', icon: '🏠', page: 'dashboard' },
    { labelKey: 'cases', icon: '📁', page: 'cases', children: [
      { labelKey: 'allCases', icon: '', page: 'cases' },
     // { labelKey: 'incoming', icon: '', page: 'incoming' },
      
    //  { labelKey: 'pendingDecision', icon: '', page: 'pending' },
      { labelKey: 'transferred', icon: '', page: 'transferred' },
      //{ labelKey: 'delayed', icon: '', page: 'delayed' },
      { labelKey: 'archived', icon: '', page: 'archived' },
      //{ labelKey: 'waiting', icon: '', page: 'waiting' },
    ]},
   // { labelKey: 'workflow', icon: '🔄', page: 'workflow' },
   // { labelKey: 'documents', icon: '📄', page: 'documents' },
    { labelKey: 'reports', icon: '📊', page: 'reports' },
    { labelKey: 'notifications', icon: '🔔', page: 'notifications' },
  ],
  directorate: [
    { labelKey: 'dashboard', icon: '🏠', page: 'dashboard' },
    { labelKey: 'cases', icon: '📁', page: 'cases', children: [
      { labelKey: 'allCases', icon: '', page: 'cases' },
      { labelKey: 'incoming', icon: '', page: 'incoming' },
      { labelKey: 'active', icon: '', page: 'active' },
      { labelKey: 'returned', icon: '', page: 'returned' },
      { labelKey: 'archived', icon: '', page: 'archived' },
    ]},
    { labelKey: 'groups', icon: '👥', page: 'groups' },
    { labelKey: 'transfers', icon: '🔄', page: 'transfers' },
    { labelKey: 'documents', icon: '📄', page: 'documents' },
    { labelKey: 'reports', icon: '📊', page: 'reports' },
    { labelKey: 'notifications', icon: '🔔', page: 'notifications' },
  ],
  group: [
    { labelKey: 'dashboard', icon: '🏠', page: 'dashboard' },
    { labelKey: 'myCases', icon: '📁', page: 'cases' },
    { labelKey: 'documents', icon: '📄', page: 'documents' },
    { labelKey: 'myRemarks', icon: '💬', page: 'remarks' },
    { labelKey: 'delayed', icon: '⚠️', page: 'delayed' },
    { labelKey: 'notifications', icon: '🔔', page: 'notifications' },
  ],
  admin: [
    { labelKey: 'dashboard', icon: '🏠', page: 'dashboard' },
    { labelKey: 'users', icon: '👥', page: 'users' },
    { labelKey: 'organization', icon: '🏢', page: 'org', children: [
      { labelKey: 'sectors', icon: '', page: 'sectors' },
      { labelKey: 'directorates', icon: '', page: 'directorates' },
      { labelKey: 'groups', icon: '', page: 'groups' },
    ]},
    { labelKey: 'rolesPermissions', icon: '🔐', page: 'roles' },
    { labelKey: 'auditLogs', icon: '📋', page: 'audit' },
    { labelKey: 'systemSettings', icon: '⚙️', page: 'settings' },
    { labelKey: 'notifications', icon: '🔔', page: 'notifications' },
  ],
}

const ROLE_LABELS: Record<Role, string> = {
  records: 'Records & Archive',
  sector: 'Housing Development Sector',
  directorate: 'Directorate A',
  group: 'Group A1',
  admin: 'System Administration',
}

const ROLE_USER: Record<Role, string> = {
  records: 'Sara Haile',
  sector: 'Yonas Tesfaye',
  directorate: 'Meron Alemu',
  group: 'Daniel Girma',
  admin: 'System Admin',
}

// ── Sidebar ────────────────────────────────────────────
interface SidebarProps {
  role: Role
  unitName?: string
  page: string
  setPage: (p: string) => void
  onLogout: () => void
  collapsed?: boolean
}

export function Sidebar({ role, unitName, page, setPage, onLogout, collapsed = false }: SidebarProps) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ cases: true, org: false })
  const nav = NAV[role]
  const displayUnit = unitName || ROLE_LABELS[role]
  const displayUser = ROLE_USER[role]

  return (
    <aside className={`flex flex-col bg-[#1E4B8F] text-white ${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 min-h-screen transition-all duration-200`}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        {collapsed ? (
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-black text-sm">F</div>
        ) : (
          <>
            <div className="text-lg font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>FHC DWTRS</div>
            <div className="text-xs text-blue-200 mt-0.5 leading-snug">{displayUnit}</div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-0.5">
        {nav.map(item => {
          const hasChildren = item.children && item.children.length > 0
          const isActive = page === item.page || item.children?.some(c => c.page === page)
          const isExpanded = expanded[item.page]

          return (
            <div key={item.page}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    setExpanded(e => ({ ...e, [item.page]: !e[item.page] }))
                    setPage(item.children![0].page)
                  } else {
                    setPage(item.page)
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{t(item.labelKey)}</span>
                    {hasChildren && (
                      <span className="text-xs text-blue-300">{isExpanded ? '▾' : '›'}</span>
                    )}
                  </>
                )}
              </button>
              {!collapsed && hasChildren && isExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {item.children!.map(child => (
                    <button
                      key={child.page}
                      onClick={() => setPage(child.page)}
                      className={`w-full flex items-center gap-2 pl-4 pr-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${page === child.page ? 'bg-white/15 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                      {t(child.labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <button
          onClick={() => setPage('profile')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-white/10 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {displayUser[0]}
          </div>
          {!collapsed && <span className="truncate">{displayUser}</span>}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span className="text-base flex-shrink-0">🚪</span>
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </aside>
  )
}

// ── TopBar ─────────────────────────────────────────────
interface TopBarProps {
  role: Role
  unitName?: string
  pageTitle: string
  onSearch?: (q: string) => void
}

export function TopBar({ role, unitName, pageTitle, onSearch }: TopBarProps) {
  const { t } = useLanguage()
  const [notifOpen, setNotifOpen] = useState(false)
  const displayUnit = unitName || ROLE_LABELS[role]
  const displayUser = ROLE_USER[role]

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-20">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder={`${t('search')}…`}
          onChange={e => onSearch?.(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20 focus:border-[#1E4B8F] focus:bg-white transition-all"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Language toggle */}
        <LangToggle className="border-gray-200 text-gray-500 hover:border-[#1E4B8F] hover:text-[#1E4B8F] bg-white hidden sm:inline-flex" />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
          >
            <span className="text-base">🔔</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('notifications')}</p>
              </div>
              {NOTIFS[role]?.map((n, i) => (
                <div key={i} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <p className="text-xs text-gray-700 leading-relaxed">{n.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1E4B8F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {displayUser[0]}
          </div>
          <div className="hidden sm:block max-w-[180px]">
            <p className="text-xs font-semibold text-gray-900 truncate">{displayUser}</p>
            <p className="text-xs text-gray-400 truncate">{displayUnit}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

const NOTIFS: Record<Role, { text: string; time: string }[]> = {
  records: [
    { text: 'Case FHC-2026-006 has been successfully registered.', time: '30 minutes ago' },
    { text: 'Document upload required for FHC-2026-004.', time: '2 hours ago' },
    { text: 'FHC-2026-002 moved to Housing Development Sector.', time: 'Aug 14, 2026' },
  ],
  sector: [
    { text: 'New case FHC-2026-006 received from Records & Archive.', time: '30 minutes ago' },
    { text: 'Directorate A transferred FHC-2026-007 to Directorate B.', time: '1 hour ago' },
    { text: 'FHC-2026-001 is ready for final decision.', time: '2 hours ago' },
    { text: 'FHC-2026-007 has been flagged as delayed (12 days).', time: 'Aug 14, 2026' },
  ],
  directorate: [
    { text: 'Group A1 has completed work on FHC-2026-001.', time: '1 hour ago' },
    { text: 'New case FHC-2026-006 assigned from Sector.', time: '3 hours ago' },
    { text: 'FHC-2026-004 has been returned by Group A2.', time: '4 hours ago' },
  ],
  group: [
    { text: 'New case FHC-2026-006 assigned to Group A1.', time: '3 hours ago' },
    { text: 'Directorate A added a remark on FHC-2026-001.', time: '5 hours ago' },
    { text: 'FHC-2026-004 has been returned for additional work.', time: 'Aug 14, 2026' },
  ],
  admin: [
    { text: 'New user account created: sara.h', time: '1 hour ago' },
    { text: 'User almaz.b password has been reset.', time: '2 hours ago' },
    { text: 'Organizational unit "Group A2" added.', time: '3 hours ago' },
  ],
}

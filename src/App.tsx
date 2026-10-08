import { useState, useEffect } from 'react'
import type { AuthUser, Role } from './types'
import { getMe } from './api/auth.api'
import { LangProvider } from './i18n'
import { Sidebar, TopBar } from './components/layout'
import PublicPage from './pages/PublicPage'
import LoginPage from './pages/LoginPage'
import RecordsPage from './pages/RecordsPage'
import SectorPage from './pages/SectorPage'
import DirectoratePage from './pages/DirectoratePage'
import GroupPage from './pages/GroupPage'
import AdminPage from './pages/AdminPage'

type AppView = 'public' | 'login' | 'dashboard'

// ============================================================
// BACKEND ROLE → FRONTEND ROLE
// ============================================================

function mapBackendRole(role: string | undefined): Role | null {
  if (!role) return null

  switch (role) {
    case 'SYSTEM_ADMIN':
      return 'admin'

    case 'RECORDS_ARCHIVE_STAFF':
      return 'records'

    case 'SECTOR_STAFF':
      return 'sector'

    case 'DIRECTORATE_STAFF':
      return 'directorate'

    case 'GROUP_STAFF':
      return 'group'

    default:
      return null
  }
}

// ============================================================
// APP
// ============================================================

export default function App() {
  const [view, setView] = useState<AppView>('public')
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [page, setPage] = useState('dashboard')

  // ----------------------------------------------------------
  // Backend now returns ONE role instead of roles[]
  // ----------------------------------------------------------

  const role = authUser
    ? mapBackendRole(authUser.role)
    : null


  const unitName = authUser?.unit?.name ?? ''

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  function handleLogin(user: AuthUser) {
    setAuthUser(user)
    setView('dashboard')
    setPage('dashboard')
  }

  // ----------------------------------------------------------
  // Refresh current user from GET /auth/me so the profile
  // (name + unit) shown in the sidebar/topbar is always the
  // real one, even if the login payload omits the unit object.
  // ----------------------------------------------------------

  useEffect(() => {
    if (view !== 'dashboard') return

    let cancelled = false

    async function refreshCurrentUser() {
      try {
        const result = await getMe()

        if (!cancelled && result.user) {
          setAuthUser(result.user)
        }
      } catch (err) {
        console.error('Failed to refresh current user:', err)
      }
    }
    
    refreshCurrentUser()

    return () => {
      cancelled = true
    }
  }, [view])

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  function handleLogout() {
    setAuthUser(null)
    setView('public')
    setPage('dashboard')
  }

  // ----------------------------------------------------------
  // PUBLIC PAGE
  // ----------------------------------------------------------

  if (view === 'public') {
    return (
      <LangProvider>
        <PublicPage
          onGoLogin={() => setView('login')}
        />
      </LangProvider>
    )
  }

  // ----------------------------------------------------------
  // LOGIN PAGE
  // ----------------------------------------------------------

  if (view === 'login') {
    return (
      <LangProvider>
        <LoginPage
          onLogin={handleLogin}
          onBack={() => setView('public')}
        />
      </LangProvider>
    )
  }

  // ----------------------------------------------------------
  // INVALID / UNKNOWN ROLE
  // ----------------------------------------------------------

  if (!role) {
    return (
      <LangProvider>
        <PublicPage
          onGoLogin={() => setView('login')}
        />
      </LangProvider>
    )
  }

  // ----------------------------------------------------------
  // AUTHENTICATED APPLICATION
  // ----------------------------------------------------------

  return (
    <LangProvider>
      <div className="flex h-screen overflow-hidden bg-[#F7F9FA]">
        <Sidebar
          role={role}
          userName={authUser?.name}
          unitName={unitName}
          page={page}
          setPage={setPage}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar
            role={role}
            userName={authUser?.name}
            unitName={unitName}
            pageTitle={page}
          />

          <main className="flex-1 overflow-y-auto">
            {/* ------------------------------------------------ */}
            {/* RECORDS & ARCHIVE */}
            {/* ------------------------------------------------ */}

            {role === 'records' && (
              <RecordsPage
                page={page}
                setPage={setPage}
              />
            )}

            {/* ------------------------------------------------ */}
            {/* SECTOR */}
            {/* ------------------------------------------------ */}

            {role === 'sector' && (
              <SectorPage
                page={page}
                setPage={setPage}
              />
            )}

            {/* ------------------------------------------------ */}
            {/* DIRECTORATE */}
            {/* ------------------------------------------------ */}

            {role === 'directorate' && (
              <DirectoratePage
                page={page}
                setPage={setPage}
               // directorateName={unitName}
               // directorateUnitId={authUser?.unit?.id ?? ''}

              />
            )}

            {/* ------------------------------------------------ */}
            {/* GROUP */}
            {/* ------------------------------------------------ */}

            {role === 'group' && (
              <GroupPage
                page={page}
                setPage={setPage}
              />
            )}

            {/* ------------------------------------------------ */}
            {/* SYSTEM ADMIN */}
            {/* ------------------------------------------------ */}

            {role === 'admin' && (
              <AdminPage
                page={page}
                setPage={setPage}
              />
            )}
          </main>
        </div>
      </div>
    </LangProvider>
  )
}
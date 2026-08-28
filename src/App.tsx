import { useState } from 'react'
import type { Role } from './types'
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

export default function App() {
  const [view, setView] = useState<AppView>('public')
  const [role, setRole] = useState<Role | null>(null)
  // unitName carries the specific organisational unit (sector name, directorate, group)
  const [unitName, setUnitName] = useState<string>('')
  const [page, setPage] = useState('dashboard')

  function handleLogin(r: Role, unit?: string) {
    setRole(r)
    setUnitName(unit ?? '')
    setView('dashboard')
    setPage('dashboard')
  }

  function handleLogout() {
    setRole(null)
    setUnitName('')
    setView('public')
    setPage('dashboard')
  }

  if (view === 'public') return <LangProvider><PublicPage onGoLogin={() => setView('login')} /></LangProvider>
  if (view === 'login') return <LangProvider><LoginPage onLogin={handleLogin} onBack={() => setView('public')} /></LangProvider>

  return (
    <LangProvider>
      <div className="flex h-screen overflow-hidden bg-[#F7F8FA]">
        <Sidebar role={role!} unitName={unitName} page={page} setPage={setPage} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar role={role!} unitName={unitName} pageTitle={page} />
          <main className="flex-1 overflow-y-auto">
            {role === 'records'     && <RecordsPage     page={page} setPage={setPage} />}
            {role === 'sector'      && <SectorPage       page={page} setPage={setPage} sectorName={unitName} />}
            {role === 'directorate' && <DirectoratePage  page={page} setPage={setPage} />}
            {role === 'group'       && <GroupPage        page={page} setPage={setPage} />}
            {role === 'admin'       && <AdminPage        page={page} setPage={setPage} />}
          </main>
        </div>
      </div>
    </LangProvider>
  )
}

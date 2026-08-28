import { useState } from 'react'
import { USERS, AUDIT_LOGS, ORG_UNITS } from '../data'
import { KpiCard, Btn, Modal, Input, Select } from '../components/ui'
import type { User } from '../types'
import { useLanguage } from '../i18n'

interface Props {
  page: string
  setPage: (p: string) => void
}

export default function AdminPage({ page, setPage }: Props) {
  const { t } = useLanguage()
  if (page === 'users') return <UsersPage />
  if (page === 'org' || page === 'sectors' || page === 'directorates' || page === 'groups') return <OrgPage tab={page} />
  if (page === 'audit') return <AuditPage />
  if (page === 'roles') return <RolesPage />
  if (page === 'settings') return <SettingsPage />

  // Dashboard
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('systemAdmin')}</h1>
        <p className="text-gray-500 text-sm">FHC DWTRS · System Overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={t('kpi_totalUsers')} value={86} icon="👥" onClick={() => setPage('users')} />
        <KpiCard label={t('kpi_activeUsers')} value={78} icon="✅" accent="#16A34A" />
        <KpiCard label={t('kpi_sectors')} value={4} icon="🏢" accent="#7C3AED" onClick={() => setPage('sectors')} />
        <KpiCard label={t('kpi_directorates')} value={12} icon="🏛" accent="#2563EB" onClick={() => setPage('directorates')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{t('recentSystemActivity')}</h2>
            <button onClick={() => setPage('audit')} className="text-xs text-[#1E4B8F] font-semibold hover:underline">{t('viewAll')}</button>
          </div>
          <div className="divide-y divide-gray-50">
            {AUDIT_LOGS.slice(0, 6).map(log => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${log.type === 'user' ? 'bg-blue-50' : log.type === 'case' ? 'bg-green-50' : log.type === 'org' ? 'bg-purple-50' : 'bg-amber-50'}`}>
                  {log.type === 'user' ? '👤' : log.type === 'case' ? '📋' : log.type === 'org' ? '🏢' : '🔄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{log.action}</p>
                  <p className="text-xs text-gray-400 truncate">{log.entity} · {log.user}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>System Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Database', status: 'Operational' },
                { label: 'Backend Services', status: 'Operational' },
                { label: 'File Storage', status: 'Operational' },
                { label: 'Notifications', status: 'Operational' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-600 font-semibold">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Quick Actions</h2>
            <div className="space-y-2">
              <Btn variant="secondary" className="w-full justify-start" onClick={() => setPage('users')}>👤 Create User</Btn>
              <Btn variant="secondary" className="w-full justify-start" onClick={() => setPage('org')}>🏢 Add Org Unit</Btn>
              <Btn variant="secondary" className="w-full justify-start" onClick={() => setPage('audit')}>📋 View Audit Logs</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Users Page ─────────────────────────────────────────
function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) &&
    (selectedRole === '' || u.role === selectedRole)
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>User Management</h2>
        <Btn onClick={() => setCreateOpen(true)}>+ Create User</Btn>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20" />
        <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20">
          <option value="">All Roles</option>
          <option value="records">Records & Archive</option>
          <option value="sector">Sector</option>
          <option value="directorate">Directorate</option>
          <option value="group">Group</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Username', 'Role', 'Unit', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1E4B8F] flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                      <span className="font-semibold text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{u.username}</td>
                  <td className="px-5 py-3.5">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[200px] truncate">{u.unit}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button className="text-xs text-[#1E4B8F] font-semibold hover:underline">Edit</button>
                      <button className={`text-xs font-semibold hover:underline ${u.status === 'Active' ? 'text-red-500' : 'text-green-600'}`}>
                        {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    admin: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Admin' },
    sector: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Sector' },
    directorate: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Directorate' },
    group: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Group' },
    records: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Records' },
  }
  const c = config[role] || { bg: 'bg-gray-100', text: 'text-gray-600', label: role }
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
}

function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [role, setRole] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Create User" width="max-w-lg">
      <div className="space-y-3">
        <Input label="Full Name *" placeholder="Abebe Kebede" />
        <Input label="Username *" placeholder="abebe.k" />
        <Input label="Email" type="email" placeholder="abebe@fhc.gov.et" />
        <Select
          label="Role *"
          value={role}
          onChange={e => setRole(e.target.value)}
          options={[
            { value: 'records', label: 'Records & Archive' },
            { value: 'sector', label: 'Sector' },
            { value: 'directorate', label: 'Directorate' },
            { value: 'group', label: 'Group' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
        {role === 'sector' && <Select label="Sector *" options={[{ value: 'Housing Development Sector', label: 'Housing Development Sector' }, { value: 'Corporate Service Sector', label: 'Corporate Service Sector' }]} />}
        {role === 'directorate' && (
          <>
            <Select label="Sector *" options={[{ value: 'Housing Development Sector', label: 'Housing Development Sector' }]} />
            <Select label="Directorate *" options={[{ value: 'Directorate A', label: 'Directorate A' }, { value: 'Directorate B', label: 'Directorate B' }]} />
          </>
        )}
        {role === 'group' && (
          <>
            <Select label="Sector *" options={[{ value: 'Housing Development Sector', label: 'Housing Development Sector' }]} />
            <Select label="Directorate *" options={[{ value: 'Directorate A', label: 'Directorate A' }]} />
            <Select label="Group *" options={[{ value: 'Group A1', label: 'Group A1' }, { value: 'Group A2', label: 'Group A2' }]} />
          </>
        )}
        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" defaultChecked className="rounded" />
          <label className="text-xs text-gray-600 font-medium">Active (user can login immediately)</label>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancel</Btn>
        <Btn onClick={onClose} className="flex-1">Create User</Btn>
      </div>
    </Modal>
  )
}

// ── Org Page ───────────────────────────────────────────
function OrgPage({ tab }: { tab: string }) {
  const [createOpen, setCreateOpen] = useState(false)
  const sectors = ORG_UNITS.filter(u => u.type === 'sector')
  const dirs = ORG_UNITS.filter(u => u.type === 'directorate')
  const groups = ORG_UNITS.filter(u => u.type === 'group')

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Organization Structure</h2>
        <Btn onClick={() => setCreateOpen(true)}>+ Add Unit</Btn>
      </div>

      {/* Tree view */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          {sectors.map(s => (
            <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-[#EEF4FF] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏢</span>
                  <span className="text-sm font-bold text-[#1E4B8F]">{s.name}</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span><strong>{s.active}</strong> active</span>
                  <span><strong>{s.pending}</strong> pending</span>
                  {s.delayed > 0 && <span className="text-red-600"><strong>{s.delayed}</strong> delayed</span>}
                </div>
              </div>
              {dirs.filter(d => d.parent === s.id).map(d => (
                <div key={d.id} className="border-t border-gray-100">
                  <div className="bg-gray-50 pl-10 pr-5 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏛</span>
                      <span className="text-sm font-semibold text-gray-700">{d.name}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>{d.active} active</span>
                      <span>{d.pending} pending</span>
                    </div>
                  </div>
                  {groups.filter(g => g.parent === d.id).map(g => (
                    <div key={g.id} className="border-t border-gray-100 pl-20 pr-5 py-2 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">👥</span>
                        <span className="text-xs font-medium text-gray-600">{g.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{g.active} active</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Organizational Unit">
        <div className="space-y-3">
          <Select label="Unit Type *" options={[{ value: 'sector', label: 'Sector' }, { value: 'directorate', label: 'Directorate' }, { value: 'group', label: 'Group' }]} />
          <Input label="Name *" placeholder="e.g. Housing Development Sector" />
          <Select label="Parent Unit" options={[{ value: '', label: 'None (top-level)' }, ...ORG_UNITS.map(u => ({ value: u.id, label: u.name }))]} />
        </div>
        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Btn>
          <Btn onClick={() => setCreateOpen(false)} className="flex-1">Create</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ── Audit Logs ─────────────────────────────────────────
function AuditPage() {
  const [search, setSearch] = useState('')
  const filtered = AUDIT_LOGS.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.entity.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Audit Logs</h2>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs…" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Timestamp', 'User', 'Action', 'Entity', 'Type'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-xs font-mono text-gray-500">{log.timestamp}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{log.user}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{log.action}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-[200px] truncate">{log.entity}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      log.type === 'user' ? 'bg-blue-50 text-blue-700' :
                      log.type === 'case' ? 'bg-green-50 text-green-700' :
                      log.type === 'org' ? 'bg-purple-50 text-purple-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{log.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Roles & Permissions ────────────────────────────────
function RolesPage() {
  const roles = ['Records & Archive', 'Sector', 'Directorate', 'Group', 'Admin']
  const perms = ['View Cases', 'Register Cases', 'Approve', 'Reject', 'Transfer', 'Upload Docs', 'Reports', 'User Mgmt']
  const matrix: Record<string, string[]> = {
    'Records & Archive': ['View Cases', 'Register Cases', 'Upload Docs'],
    'Sector': ['View Cases', 'Approve', 'Reject', 'Transfer', 'Upload Docs', 'Reports'],
    'Directorate': ['View Cases', 'Transfer', 'Upload Docs', 'Reports'],
    'Group': ['View Cases', 'Upload Docs'],
    'Admin': ['View Cases', 'User Mgmt', 'Reports'],
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-black text-gray-900 mb-6" style={{ fontFamily: 'var(--font-display)' }}>Roles & Permissions</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Role</th>
                {perms.map(p => <th key={p} className="text-center px-3 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-800">{role}</td>
                  {perms.map(p => (
                    <td key={p} className="px-3 py-4 text-center">
                      {matrix[role]?.includes(p) ? (
                        <span className="text-green-500 font-bold text-base">✓</span>
                      ) : (
                        <span className="text-gray-200 font-bold text-base">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Settings ───────────────────────────────────────────
function SettingsPage() {
  return (
    <div className="p-6 max-w-xl space-y-5">
      <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>System Settings</h2>
      {[
        { title: 'Tracking Number Format', content: (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Current format: <span className="font-mono font-semibold text-gray-800">FHC-{'{YEAR}'}-{'{SEQUENCE}'}</span></p>
            <p className="text-xs text-gray-400">Example: FHC-2026-001</p>
          </div>
        )},
        { title: 'Notification Settings', content: (
          <div className="space-y-2">
            {['Enable system notifications', 'Email notifications', 'Case assignment alerts', 'Delay alerts'].map(s => (
              <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" defaultChecked={s !== 'Email notifications'} className="rounded" />
                {s}
              </label>
            ))}
          </div>
        )},
        { title: 'Case Settings', content: (
          <div className="space-y-2">
            {['Enable document versioning', 'Enable audit logging', 'Auto-archive approved cases', 'Delay threshold: 7 days'].map(s => (
              <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                {s}
              </label>
            ))}
          </div>
        )},
      ].map(section => (
        <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-3">{section.title}</h3>
          {section.content}
        </div>
      ))}
      <Btn>Save Changes</Btn>
    </div>
  )
}

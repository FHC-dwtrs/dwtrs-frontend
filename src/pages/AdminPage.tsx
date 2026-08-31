import { useEffect, useState } from 'react'
import { KpiCard, Btn, Modal, Input, Select } from '../components/ui'
import { useLanguage } from '../i18n'
import {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  type OrganizationUnit,
  type UnitType,
} from '@/api/organizations.api'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  type User,
  type UserRole,
} from '@/api/users.api'
import { AuditLog, getAuditLogs } from '@/api/audit.api'

interface Props {
  page: string
  setPage: (p: string) => void
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AdminPage({ page, setPage }: Props) {
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([])
const [auditLoading, setAuditLoading] = useState(false)
const [orgUnits, setOrgUnits] = useState<OrganizationUnit[]>([])
const [totalUsers, setTotalUsers] = useState(0)
const [activeUsers, setActiveUsers] = useState(0)
  const { t } = useLanguage()


  useEffect(() => {
    getUsers().then(res => {
      const users = res.data ?? []
      setTotalUsers(users.length)
      setActiveUsers(users.filter(u => u.isActive).length)
    }).catch(console.error)
  }, [])


  useEffect(() => {
    async function loadRecentActivity() {
      try {
        setAuditLoading(true)
        const result = await getAuditLogs()
        setRecentAuditLogs((result.data ?? []).slice(0, 5)) // top 5 for the dashboard widget
      } catch (error: any) {
        console.error('Failed to load recent activity:', error)
      } finally {
        setAuditLoading(false)
      }
    }
    loadRecentActivity()
  }, [])

  useEffect(() => {
    getOrganizations().then(res => setOrgUnits(res.data ?? [])).catch(console.error)
  }, [])

  if (page === 'users') return <UsersPage />

  if (
    page === 'org' ||
    page === 'sectors' ||
    page === 'directorates' ||
    page === 'groups'
  ) {
    return <OrgPage tab={page} />
  }

  if (page === 'audit') return <AuditPage />
  if (page === 'roles') return <RolesPage />
  if (page === 'settings') return <SettingsPage />


  const sectorCount = orgUnits.filter(u => u.unitType === 'SECTOR').length
const directorateCount = orgUnits.filter(u => u.unitType === 'DIRECTORATE').length

  // Dashboard
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1
          className="text-2xl font-black text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('systemAdmin')}
        </h1>

        <p className="text-gray-500 text-sm">
          FHC DWTRS · System Overview
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
      <KpiCard label={t('kpi_totalUsers')} value={totalUsers} icon="👥" onClick={() => setPage('users')} />
<KpiCard label={t('kpi_activeUsers')} value={activeUsers} icon="✅" accent="#16A34A" />
<KpiCard label={t('kpi_sectors')} value={sectorCount} icon="🏢" accent="#7C3AED" onClick={() => setPage('sectors')} />
<KpiCard label={t('kpi_directorates')} value={directorateCount} icon="🏛" accent="#2563EB" onClick={() => setPage('directorates')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('recentSystemActivity')}
            </h2>

            <button
              onClick={() => setPage('audit')}
              className="text-xs text-[#1E4B8F] font-semibold hover:underline"
            >
              {t('viewAll')}
            </button>
          </div>
          <div className="divide-y divide-gray-50">
              {auditLoading ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-500">
                    Loading recent activity...
                  </p>
                </div>
              ) : recentAuditLogs.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-500">
                    No recent system activity.
                  </p>
                </div>
              ) : (
                recentAuditLogs.map(log => (
                  <div
                    key={log.auditLogId}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                        log.entityType === 'USER'
                          ? 'bg-blue-50'
                          : log.entityType === 'CASE'
                            ? 'bg-green-50'
                            : log.entityType ===
                                'ORGANIZATIONAL_UNIT'
                              ? 'bg-purple-50'
                              : 'bg-amber-50'
                      }`}
                    >
                      {log.entityType === 'USER'
                        ? '👤'
                        : log.entityType === 'CASE'
                          ? '📋'
                          : log.entityType ===
                              'ORGANIZATIONAL_UNIT'
                            ? '🏢'
                            : '🔄'}
                    </div>

                    {/* Activity */}
                    <div className="flex-1 min-w-0"> 
                      <p className="text-sm font-medium text-gray-800"> 
                        {formatAuditAction(log.action)}
                        {getActivityDetail(log) && (
                          <span className="text-gray-500 font-normal"> — {getActivityDetail(log)}</span>
                        )}
                      </p> 

                      <p className="text-xs text-gray-400 truncate"> 
                        {(() => {
                          const values = log.newValues ?? log.oldValues
                          const parentName = getParentName(orgUnits, values?.parentUnitId as string | undefined)
                          return parentName
                            ? `Under ${parentName} · ${log.user.name}`
                            : `${formatAuditAction(log.entityType)} · ${log.user.name}`
                        })()}
                      </p> 
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>

          </div>

        {/* System status */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2
              className="text-base font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              System Status
            </h2>

            <div className="space-y-3">
              {[
                { label: 'Database', status: 'Operational' },
                { label: 'Backend Services', status: 'Operational' },
                { label: 'File Storage', status: 'Operational' },
                { label: 'Notifications', status: 'Operational' },
              ].map(s => (
                <div
                  key={s.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">
                    {s.label}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />

                    <span className="text-xs text-green-600 font-semibold">
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2
              className="text-base font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Quick Actions
            </h2>

            <div className="space-y-2">
              <Btn
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setPage('users')}
              >
                👤 Create User
              </Btn>

              <Btn
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setPage('org')}
              >
                🏢 Add Org Unit
              </Btn>

              <Btn
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setPage('audit')}
              >
                📋 View Audit Logs
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

//---------------------------
//functions
//-------------------------

function SectionTitle({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pt-2">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {children}
      </h4>
      <div className="border-b border-gray-100 mt-2" />
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <p className="text-xs text-gray-400 font-semibold uppercase">
        {label}
      </p>

      <p className="text-sm text-gray-800 text-right">
        {value}
      </p>
    </div>
  )
}

function getActivityDetail(log: AuditLog) {
  const values = log.newValues ?? log.oldValues
  if (!values) return null

  const name = values.name as string | undefined
  const unitType = values.unitType as string | undefined

  if (!name) return null

  return unitType ? `${name} (${unitType})` : name
}

function getParentName(orgUnits: OrganizationUnit[], parentUnitId: string | null | undefined) {
  if (!parentUnitId) return null
  return orgUnits.find(u => u.unitId === parentUnitId)?.name ?? null
}
// ───────────────────────────────────────────────────────
// Users Page
// ───────────────────────────────────────────────────────

function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false)

  const [users, setUsers] = useState<User[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)

  const [loadingUser, setLoadingUser] =
    useState(false)

  async function loadUsers() {
    try {
      setLoading(true)
      setError('')

      const result = await getUsers()

      setUsers(result.data ?? [])
    } catch (error: any) {
      console.error(
        'Failed to load users:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Failed to load users.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleUserClick(userId: string) {
    try {
      setLoadingUser(true)
      setError('')

      const result = await getUser(userId)

      setSelectedUser(result.data)
      setDetailsOpen(true)
    } catch (error: any) {
      console.error(
        'Failed to load user:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Failed to load user details.'
      )
    } finally {
      setLoadingUser(false)
    }
  }

  function handleUserUpdated(updatedUser: User) {
    setSelectedUser(updatedUser)

    setUsers(currentUsers =>
      currentUsers.map(user =>
        user.userId === updatedUser.userId
          ? updatedUser
          : user
      )
    )
  }

  const filtered = users.filter(user => {
    const matchesSearch =
      user.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      user.email
        .toLowerCase()
        .includes(search.toLowerCase())

        const matchesRole =
        selectedRole === '' ||
        user.role?.name === selectedRole

    return matchesSearch && matchesRole
  })

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-black text-gray-900"
          style={{
            fontFamily: 'var(--font-display)',
          }}
        >
          User Management
        </h2>

        <Btn onClick={() => setCreateOpen(true)}>
          + Create User
        </Btn>
      </div>

      {/* Search / Filter */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
          placeholder="Search users…"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20"
        />

        <select
          value={selectedRole}
          onChange={e =>
            setSelectedRole(e.target.value)
          }
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20"
        >
          <option value="">
            All Roles
          </option>

          <option value="RECORDS_ARCHIVE_STAFF">
            Records & Archive
          </option>

          <option value="SECTOR_STAFF">
            Sector
          </option>

          <option value="DIRECTORATE_STAFF">
            Directorate
          </option>

          <option value="GROUP_STAFF">
            Group
          </option>

          <option value="SYSTEM_ADMIN">
            Admin
          </option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">
              Loading users...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">
              👥
            </div>

            <h3 className="font-bold text-gray-900">
              No users found
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Unit', 'Status'].map(
                    heading => (
                      <th
                        key={heading}
                        className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filtered.map(user => (
                  <tr
                    key={user.userId}
                    onClick={() =>
                      handleUserClick(
                        user.userId
                      )
                    }
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E4B8F] flex items-center justify-center text-white text-xs font-bold">
                          {user.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <span className="font-semibold text-gray-900">
                            {user.name}
                          </span>

                          <p className="text-xs text-gray-400 mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[240px]">
                      {user.unit?.name ||
                        'No organizational unit'}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${
                          user.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive
                              ? 'bg-green-500'
                              : 'bg-gray-400'
                          }`}
                        />

                        {user.isActive
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User */}
      <CreateUserModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          loadUsers()
        }}
      />

      {/* User Details */}
      <UserDetailsModal
        open={detailsOpen}
        user={selectedUser}
        loading={loadingUser}
        onClose={() => {
          setDetailsOpen(false)
          setSelectedUser(null)
        }}
        onUpdated={handleUserUpdated}
      />
    </div>
  )
}


function UserDetailsModal({
  open,
  user,
  loading,
  onClose,
  onUpdated,
}: {
  open: boolean
  user: User | null
  loading: boolean
  onClose: () => void
  onUpdated: (user: User) => void
}) {
  const [editing, setEditing] =
    useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [unitId, setUnitId] = useState('')

  const [organizations, setOrganizations] =
    useState<OrganizationUnit[]>([])

  const [loadingUnits, setLoadingUnits] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [statusUpdating, setStatusUpdating] =
    useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    if (user) {
      if (user) {
        if (user) {
          setName(user.name)
        }
      }
    }
    if (user) {
      setEmail(user.email)
    }
    setUnitId(user.unit?.unitId ?? '')
    setEditing(false)
    setError('')
  }, [user])

  useEffect(() => {
    if (!open || !editing) return

    async function loadUnits() {
      try {
        setLoadingUnits(true)

        const result =
          await getOrganizations({
            isActive: true,
          })

        setOrganizations(result.data ?? [])
      } catch (error: any) {
        console.error(
          'Failed to load organizational units:',
          error
        )

        setError(
          error.response?.data?.message ||
            'Failed to load organizational units.'
        )
      } finally {
        setLoadingUnits(false)
      }
    }

    loadUnits()
  }, [open, editing])

  if (!open) return null

  if (loading) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="User Details"
        width="max-w-lg"
      >
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">
            Loading user details...
          </p>
        </div>
      </Modal>
    )
  }

  if (!user) return null

  async function handleSave() {
    if (!name.trim()) {
      setError('Full name is required.')
      return
    }

    if (!email.trim()) {
      setError('Email is required.')
      return
    }

    if (!unitId) {
      setError(
        'Organizational unit is required.'
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      const result = await updateUser(
        user?.userId ?? '',
        {
          name: name.trim(),
          email: email.trim(),
          unitId,
        }
      )

      onUpdated(result.data)

      setEditing(false)
    } catch (error: any) {
      console.error(
        'Failed to update user:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Failed to update user.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange() {
    const nextStatus = user ? !user.isActive : false

    try {
      setStatusUpdating(true)
      setError('')

      const result =
        await updateUserStatus(
          user?.userId ?? '',
          nextStatus
        )

      onUpdated(result.data)
    } catch (error: any) {
      console.error(
        'Failed to update user status:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Failed to update user status.'
      )
    } finally {
      setStatusUpdating(false)
    }
  }

  function startEditing() {
    const currentUser = user
  
    if (!currentUser) return
  
    setEditing(true)
    setName(currentUser.name)
    setEmail(currentUser.email)
    setUnitId(currentUser.unit?.unitId ?? '')
  }

  function cancelEditing() {
    const currentUser = user
  
    if (!currentUser) return
  
    setEditing(false)
    setName(currentUser.name)
    setEmail(currentUser.email)
    setUnitId(currentUser.unit?.unitId ?? '')
    setError('')
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) return 'Never'

    return new Date(value).toLocaleString(
      undefined,
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="User Details"
      width="max-w-lg"
    >
      <div className="space-y-5">
        {/* User Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EEF4FF] flex items-center justify-center text-xl">
            👤
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {user.name}
            </h3>

            <p className="text-xs text-gray-500 mt-0.5">
              {user.email}
            </p>
          </div>

          {/* Status Toggle */}
          <button
            type="button"
            disabled={statusUpdating}
            onClick={handleStatusChange}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              user.isActive
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
            title={
              user.isActive
                ? 'Deactivate user'
                : 'Activate user'
            }
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                user.isActive
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>

          <span
            className={`text-xs font-semibold ${
              user.isActive
                ? 'text-green-600'
                : 'text-gray-500'
            }`}
          >
            {user.isActive
              ? 'Active'
              : 'Inactive'}
          </span>
        </div>

        {/* Account Information */}
        <div>
          <SectionTitle>
            Account Information
          </SectionTitle>

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {/* Name */}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-semibold uppercase">
                Full Name
              </p>

              {editing ? (
                <Input
                  value={name}
                  onChange={e =>
                    setName(e.target.value)
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-800 mt-1">
                  {user.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-semibold uppercase">
                Email
              </p>

              {editing ? (
                <Input
                  type="email"
                  value={email}
                  onChange={e =>
                    setEmail(e.target.value)
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-800 mt-1 break-all">
                  {user.email}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">
                  Status
                </p>

                <p
                  className={`text-sm mt-1 font-medium ${
                    user.isActive
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {user.isActive
                    ? 'Active'
                    : 'Inactive'}
                </p>
              </div>

              <button
                type="button"
                disabled={statusUpdating}
                onClick={handleStatusChange}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  user.isActive
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    user.isActive
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* ID */}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-semibold uppercase">
                User ID
              </p>

              <p className="text-xs font-mono text-gray-500 mt-1 break-all">
                {user.userId}
              </p>
            </div>
          </div>
        </div>

        {/* Organization */}
        <div>
          <SectionTitle>
            Organization
          </SectionTitle>

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {/* Unit */}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-semibold uppercase">
                Organizational Unit
              </p>

              {editing ? (
                <Select
                  value={unitId}
                  onChange={e =>
                    setUnitId(e.target.value)
                  }
                  options={[
                    {
                      value: '',
                      label: loadingUnits
                        ? 'Loading units...'
                        : 'Select organizational unit',
                    },
                    ...organizations.map(
                      unit => ({
                        value: unit.unitId,
                        label: `${unit.name} (${unit.unitType})`,
                      })
                    ),
                  ]}
                />
              ) : (
                <p className="text-sm text-gray-800 mt-1">
                  {user.unit?.name ||
                    'No organizational unit'}
                </p>
              )}
            </div>

            {/* Unit Type */}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-semibold uppercase">
                Unit Type
              </p>

              <p className="text-sm text-gray-800 mt-1">
                {user.unit?.unitType ||
                  'Not assigned'}
              </p>
            </div>

            {/* Parent */}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-semibold uppercase">
                Parent Unit
              </p>

              <p className="text-sm text-gray-800 mt-1">
              {user.unit?.parent?.name ?? 'None — Top Level'}
              </p>
            </div>

            {/* Unit Status */}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-semibold uppercase">
                Unit Status
              </p>

              <p
                className={`text-sm mt-1 font-medium ${
                  user.unit?.isActive
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                {user.unit
                  ? user.unit.isActive
                    ? 'Active'
                    : 'Inactive'
                  : 'Not assigned'}
              </p>
            </div>
          </div>
        </div>

        {/* Roles */}
        <div>
          <SectionTitle>
            Roles & Access
          </SectionTitle>

          <div className="border border-gray-100 rounded-xl p-4">
            {!user.role ? (
              <p className="text-sm text-gray-500">
                No role assigned.
              </p>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-800">
                    {user.role.name}
                  </span>

                  <RoleBadge role={user.role.name} />
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  {user.role.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account Activity */}
        <div>
          <SectionTitle>
            Account Activity
          </SectionTitle>

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            <DetailRow
              label="Last Login"
              value={formatDate(
                user.lastLoginAt
              )}
            />

            <DetailRow
              label="Created"
              value={formatDate(
                user.createdAt
              )}
            />

            <DetailRow
              label="Last Updated"
              value={formatDate(
                user.updatedAt
              )}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {editing ? (
            <>
              <Btn
                variant="secondary"
                onClick={cancelEditing}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Btn>

              <Btn
                onClick={handleSave}
                className="flex-1"
                disabled={
                  saving ||
                  loadingUnits
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </Btn>
            </>
          ) : (
            <>
              <Btn
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Btn>

              <Btn
                onClick={() =>
                  setEditing(true)
                }
                className="flex-1"
              >
                ✏️ Edit User
              </Btn>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
// ───────────────────────────────────────────────────────
// Role Badge
// ───────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const config: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    admin: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      label: 'Admin',
    },
    sector: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      label: 'Sector',
    },
    directorate: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      label: 'Directorate',
    },
    group: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      label: 'Group',
    },
    records: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      label: 'Records',
    },
  }

  const c = config[role] || {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: role,
  }

  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  )
}

// ───────────────────────────────────────────────────────
// Create User Modal
// ───────────────────────────────────────────────────────

function CreateUserModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [unitId, setUnitId] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [organizations, setOrganizations] = useState<
    OrganizationUnit[]
  >([])

  const [loadingUnits, setLoadingUnits] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    async function loadUnits() {
      try {
        setLoadingUnits(true)
        setError('')

        const result = await getOrganizations({
          isActive: true,
        })

        setOrganizations(result.data ?? [])
      } catch (error: any) {
        console.error(
          'Failed to load organizational units:',
          error
        )

        setError(
          error.response?.data?.message ||
            'Failed to load organizational units.'
        )
      } finally {
        setLoadingUnits(false)
      }
    }

    loadUnits()
  }, [open])

  function resetForm() {
    setName('')
    setEmail('')
    setPassword('')
    setUnitId('')
    setIsActive(true)
    setError('')
  }

  function handleClose() {
    if (creating) return

    resetForm()
    onClose()
  }

  async function handleCreateUser() {
    if (!name.trim()) {
      setError('Full name is required.')
      return
    }

    if (!email.trim()) {
      setError('Email is required.')
      return
    }

    if (!password) {
      setError('Password is required.')
      return
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.'
      )
      return
    }

    if (!unitId) {
      setError('Organizational unit is required.')
      return
    }

    try {
      setCreating(true)
      setError('')

      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        unitId,
        isActive,
      }

      console.log('Creating user:', payload)

      await createUser(payload)

      handleClose()
    } catch (error: any) {
      console.error(
        'Failed to create user:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Failed to create user.'
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create User"
      width="max-w-lg"
    >
      <div className="space-y-4">

        {/* Full Name */}
        <Input
          label="Full Name *"
          placeholder="Abebe Kebede"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        {/* Email */}
        <Input
          label="Email *"
          type="email"
          placeholder="abebe@fhc.gov.et"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        {/* Password */}
        <Input
          label="Password *"
          type="password"
          placeholder="Enter temporary password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {/* Organizational Unit */}
        <Select
          label="Organizational Unit *"
          value={unitId}
          onChange={e =>
            setUnitId(e.target.value)
          }
          options={[
            {
              value: '',
              label: loadingUnits
                ? 'Loading units...'
                : 'Select organizational unit',
            },

            ...organizations.map(unit => ({
              value: unit.unitId,
              label: `${unit.name} (${unit.unitType})`,
            })),
          ]}
        />

        {/* Active */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e =>
              setIsActive(e.target.checked)
            }
            className="rounded"
          />

          <label className="text-xs text-gray-600 font-medium">
            Active (user can login immediately)
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-5">
        <Btn
          variant="secondary"
          onClick={handleClose}
          className="flex-1"
          disabled={creating}
        >
          Cancel
        </Btn>

        <Btn
          onClick={handleCreateUser}
          className="flex-1"
          disabled={creating || loadingUnits}
        >
          {creating
            ? 'Creating...'
            : 'Create User'}
        </Btn>
      </div>
    </Modal>
  )
}

// ───────────────────────────────────────────────────────
// Organization Page
// ───────────────────────────────────────────────────────

function OrgPage({ tab }: { tab: string }) {
  const [createOpen, setCreateOpen] = useState(false)

  const [selectedUnit, setSelectedUnit] =
    useState<OrganizationUnit | null>(null)

  const [detailsOpen, setDetailsOpen] = useState(false)

  const [organizations, setOrganizations] =
    useState<OrganizationUnit[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [unitType, setUnitType] =
    useState<UnitType>('SECTOR')

  const [name, setName] = useState('')
  const [parentUnitId, setParentUnitId] = useState('')

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleUnitClick(unitId: string) {
    try {
      const result = await getOrganization(unitId)

      setSelectedUnit(result.data)
      setDetailsOpen(true)
    } catch (error: any) {
      console.error(
        'Failed to load organization:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Failed to load organizational unit.'
      )
    }
  }

  async function loadOrganizations() {
    try {
      setLoading(true)
      setError('')

      const result = await getOrganizations()

      console.log('Organizations:', result)

      setOrganizations(result.data ?? [])
    } catch (error: any) {
      console.error(
        'Failed to load organizations:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Failed to load organizational units'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [])

  const sectors = organizations.filter(
    u => u.unitType === 'SECTOR'
  )

  const dirs = organizations.filter(
    u => u.unitType === 'DIRECTORATE'
  )

  const groups = organizations.filter(
    u => u.unitType === 'GROUP'
  )

  const parentOptions =
    unitType === 'SECTOR'
      ? []
      : unitType === 'DIRECTORATE'
        ? sectors
        : dirs

  function openCreateModal() {
    setUnitType('SECTOR')
    setName('')
    setParentUnitId('')
    setCreateError('')
    setCreateOpen(true)
  }

  function closeCreateModal() {
    if (creating) return

    setCreateOpen(false)
    setName('')
    setParentUnitId('')
    setCreateError('')
  }

  async function handleCreateOrganization() {
    if (!name.trim()) {
      setCreateError(
        'Organization name is required.'
      )
      return
    }

    if (unitType !== 'SECTOR' && !parentUnitId) {
      setCreateError(
        `${
          unitType === 'DIRECTORATE'
            ? 'Sector'
            : 'Directorate'
        } is required.`
      )
      return
    }

    try {
      setCreating(true)
      setCreateError('')

      const payload = {
        name: name.trim(),
        unitType,
        parentUnitId:
          unitType === 'SECTOR'
            ? null
            : parentUnitId,
      }

      console.log(
        'Creating organization:',
        payload
      )

      await createOrganization(payload)

      await loadOrganizations()

      closeCreateModal()
    } catch (error: any) {
      console.error(
        'Failed to create organization:',
        error
      )

      setCreateError(
        error.response?.data?.message ||
          'Failed to create organizational unit.'
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-black text-gray-900"
            style={{
              fontFamily: 'var(--font-display)',
            }}
          >
            Organization Structure
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage sectors, directorates, and groups.
          </p>
        </div>

        <Btn onClick={openCreateModal}>
          + Add Unit
        </Btn>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-500">
            Loading organizational units...
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading &&
        !error &&
        organizations.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">
              🏢
            </div>

            <h3 className="font-bold text-gray-900">
              No organizational units yet
            </h3>

            <p className="text-sm text-gray-500 mt-1 mb-5">
              Start by creating a sector.
            </p>

            <Btn onClick={openCreateModal}>
              + Create First Sector
            </Btn>
          </div>
        )}

      {/* Tree view */}
      {!loading && tab === 'org' &&
      organizations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-4">
              {sectors.map(s => (
                <div
                  key={s.unitId}
                  className="border border-gray-100 rounded-xl overflow-hidden"
                >
                  {/* Sector */}
                  <div
                    className="bg-[#EEF4FF] px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#E3EDFF] transition-colors"
                    onClick={() =>
                      handleUnitClick(s.unitId)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        🏢
                      </span>

                      <span className="text-sm font-bold text-[#1E4B8F]">
                        {s.name}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        s.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {s.isActive
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>

                  {/* Directorates */}
                  {dirs
                    .filter(
                      d =>
                        d.parentUnitId ===
                        s.unitId
                    )
                    .map(d => (
                      <div
                        key={d.unitId}
                        className="border-t border-gray-100"
                      >
                        <div
                          className="bg-gray-50 pl-10 pr-5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() =>
                            handleUnitClick(
                              d.unitId
                            )
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              🏛
                            </span>

                            <span className="text-sm font-semibold text-gray-700">
                              {d.name}
                            </span>
                          </div>

                          <span
                            className={`text-xs font-semibold ${
                              d.isActive
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          >
                            {d.isActive
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </div>

                        {/* Groups */}
                        {groups
                          .filter(
                            g =>
                              g.parentUnitId ===
                              d.unitId
                          )
                          .map(g => (
                            <div
                              key={g.unitId}
                              className="border-t border-gray-100 pl-20 pr-5 py-2 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() =>
                                handleUnitClick(
                                  g.unitId
                                )
                              }
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs">
                                  👥
                                </span>

                                <span className="text-xs font-medium text-gray-600">
                                  {g.name}
                                </span>
                              </div>

                              <span
                                className={`text-xs ${
                                  g.isActive
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                                }`}
                              >
                                {g.isActive
                                  ? 'Active'
                                  : 'Inactive'}
                              </span>
                            </div>
                          ))}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Sectors-only view */}
            {!loading && tab === 'sectors' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                {sectors.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-500">No sectors yet.</div>
                ) : (
                  sectors.map(s => (
                    <div
                      key={s.unitId}
                      onClick={() => handleUnitClick(s.unitId)}
                      className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏢</span>
                        <span className="text-sm font-bold text-gray-900">{s.name}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Directorates-only view */}
            {!loading && tab === 'directorates' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                {dirs.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-500">No directorates yet.</div>
                ) : (
                  dirs.map(d => {
                    const parentSector = sectors.find(s => s.unitId === d.parentUnitId)
                    return (
                      <div
                        key={d.unitId}
                        onClick={() => handleUnitClick(d.unitId)}
                        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">🏛</span>
                          <div>
                            <span className="text-sm font-semibold text-gray-900">{d.name}</span>
                            <p className="text-xs text-gray-400">{parentSector?.name ?? 'No parent sector'}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${d.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Groups-only view */}
            {!loading && tab === 'groups' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                {groups.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-500">No groups yet.</div>
                ) : (
                  groups.map(g => {
                    const parentDir = dirs.find(d => d.unitId === g.parentUnitId)
                    return (
                      <div
                        key={g.unitId}
                        onClick={() => handleUnitClick(g.unitId)}
                        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">👥</span>
                          <div>
                            <span className="text-sm font-semibold text-gray-900">{g.name}</span>
                            <p className="text-xs text-gray-400">{parentDir?.name ?? 'No parent directorate'}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${g.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {g.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            )}



      {/* Create Organization Modal */}
      <Modal
        open={createOpen}
        onClose={closeCreateModal}
        title="Add Organizational Unit"
      >
        <div className="space-y-4">
          {/* Unit Type */}
          <Select
            label="Unit Type *"
            value={unitType}
            onChange={e => {
              const newType =
                e.target.value as UnitType

              setUnitType(newType)
              setParentUnitId('')
            }}
            options={[
              {
                value: 'SECTOR',
                label: 'Sector',
              },
              {
                value: 'DIRECTORATE',
                label: 'Directorate',
              },
              {
                value: 'GROUP',
                label: 'Group',
              },
            ]}
          />

          {/* Name */}
          <Input
            label="Name *"
            placeholder={
              unitType === 'SECTOR'
                ? 'e.g. Housing Development Sector'
                : unitType === 'DIRECTORATE'
                  ? 'e.g. Records & Archive Directorate'
                  : 'e.g. Housing Group A'
            }
            value={name}
            onChange={e =>
              setName(e.target.value)
            }
          />

          {/* Parent */}
          {unitType !== 'SECTOR' && (
            <Select
              label={
                unitType === 'DIRECTORATE'
                  ? 'Parent Sector *'
                  : 'Parent Directorate *'
              }
              value={parentUnitId}
              onChange={e =>
                setParentUnitId(
                  e.target.value
                )
              }
              options={[
                {
                  value: '',
                  label:
                    unitType === 'DIRECTORATE'
                      ? 'Select sector'
                      : 'Select directorate',
                },
                ...parentOptions.map(unit => ({
                  value: unit.unitId,
                  label: unit.name,
                })),
              ]}
            />
          )}

          {/* Error */}
          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {createError}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          <Btn
            variant="secondary"
            onClick={closeCreateModal}
            className="flex-1"
          >
            Cancel
          </Btn>

          <Btn
            onClick={handleCreateOrganization}
            className="flex-1"
            disabled={creating}
          >
            {creating
              ? 'Creating...'
              : 'Create'}
          </Btn>
        </div>
      </Modal>

      {/* Organization Details Modal */}
      <OrganizationDetailsModal
        open={detailsOpen}
        unit={selectedUnit}
        onClose={() => {
          setDetailsOpen(false)
          setSelectedUnit(null)
        }}
        onUpdated={async () => {
          await loadOrganizations()
        }}
      />
    </div>
  )
}

// ───────────────────────────────────────────────────────
// Organization Details Modal
// ───────────────────────────────────────────────────────

function OrganizationDetailsModal({
  open,
  unit,
  onClose,
  onUpdated,
}: {
  open: boolean
  unit: OrganizationUnit | null
  onClose: () => void
  onUpdated: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [statusUpdating, setStatusUpdating] =
    useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (unit) {
      setName(unit.name)
      setEditing(false)
      setError('')
    }
  }, [unit])

  if (!unit) return null

  async function handleSave() {
    /*
     * Capture the non-null unit in a local constant.
     * This fixes TS18047 inside the async function.
     */
    const currentUnit = unit
    if (!currentUnit) return

    if (!name.trim()) {
      setError(
        'Organization name is required.'
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      await updateOrganization(
        currentUnit?.unitId,
        {
          name: name.trim(),
          parentUnitId:
            currentUnit.parentUnitId,
        }
      )

      await onUpdated()

      setEditing(false)
    } catch (error: any) {
      console.error(
        'Failed to update organization:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Failed to update organizational unit.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange() {
    /*
     * Capture the current unit before entering
     * the async operation.
     */
    const currentUnit = unit
    if (!currentUnit) return
    const nextStatus = !currentUnit.isActive

    try {
      setStatusUpdating(true)
      setError('')

      await updateOrganizationStatus(
        currentUnit.unitId,
        {
          isActive: nextStatus,
        }
      )

      await onUpdated()

      /*
       * Don't mutate the prop directly.
       * Update the selected object through the parent
       * would be ideal, but because the parent reloads
       * the organizations list, we simply close/reload
       * the detail state here.
       */
      setEditing(false)
    } catch (error: any) {
      console.error(
        'Failed to update organization status:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Failed to update organizational unit status.'
      )
    } finally {
      setStatusUpdating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Organizational Unit Details"
      width="max-w-lg"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EEF4FF] flex items-center justify-center text-xl">
            {unit.unitType === 'SECTOR'
              ? '🏢'
              : unit.unitType === 'DIRECTORATE'
                ? '🏛'
                : '👥'}
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">
              {unit.unitType}
            </p>

            <h3 className="text-lg font-bold text-gray-900">
              {unit.name}
            </h3>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Unit Status
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              {unit.isActive
                ? 'This organizational unit is active.'
                : 'This organizational unit is inactive.'}
            </p>
          </div>

          <button
            type="button"
            disabled={statusUpdating}
            onClick={handleStatusChange}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              unit.isActive
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                unit.isActive
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Details */}
        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
          {/* Name */}
          <div className="px-4 py-3">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Name
            </p>

            {editing ? (
              <input
                value={name}
                onChange={e =>
                  setName(e.target.value)
                }
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20"
              />
            ) : (
              <p className="text-sm text-gray-800 mt-1">
                {unit.name}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="px-4 py-3">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Unit Type
            </p>

            <p className="text-sm text-gray-800 mt-1">
              {unit.unitType}
            </p>
          </div>

          {/* Parent */}
          <div className="px-4 py-3">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Parent Unit
            </p>

            <p className="text-sm text-gray-800 mt-1">
              {unit.parentUnitId ||
                'None — Top Level'}
            </p>
          </div>

          {/* ID */}
          <div className="px-4 py-3">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Unit ID
            </p>

            <p className="text-xs font-mono text-gray-500 mt-1 break-all">
              {unit.unitId}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {editing ? (
            <>
              <Btn
                variant="secondary"
                onClick={() => {
                  setEditing(false)
                  setName(unit.name)
                  setError('')
                }}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Btn>

              <Btn
                onClick={handleSave}
                className="flex-1"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </Btn>
            </>
          ) : (
            <>
              <Btn
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Btn>

              <Btn
                onClick={() =>
                  setEditing(true)
                }
                className="flex-1"
              >
                ✏️ Edit
              </Btn>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
//---------------------------
//audit fun
//------------------------------
function formatAuditAction(action: string) {
  return action
    .toLowerCase()
    .split('_')
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ')
}
// ───────────────────────────────────────────────────────
// Audit Logs
// ───────────────────────────────────────────────────────

function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        setLoading(true)
        setError('')

        const result = await getAuditLogs()

        setAuditLogs(result.data ?? [])
      } catch (error: any) {
        console.error(
          'Failed to load audit logs:',
          error
        )

        setError(
          error.response?.data?.message ||
            'Failed to load audit logs.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadAuditLogs()
  }, [])

  const filtered = auditLogs.filter(log => {
    const searchTerm = search.toLowerCase()

    return (
      log.action
        .toLowerCase()
        .includes(searchTerm) ||
      log.entityType
        .toLowerCase()
        .includes(searchTerm) ||
      log.entityId
        .toLowerCase()
        .includes(searchTerm) ||
      log.user.name
        .toLowerCase()
        .includes(searchTerm) ||
      log.user.email
        .toLowerCase()
        .includes(searchTerm)
    )
  })

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-black text-gray-900"
            style={{
              fontFamily: 'var(--font-display)',
            }}
          >
            Audit Logs
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Monitor system activity and important changes.
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
          placeholder="Search logs…"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/20"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-500">
            Loading audit logs...
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">
              📋
            </div>

            <h3 className="font-bold text-gray-900">
              No audit logs found
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {search
                ? 'Try a different search term.'
                : 'There is no recorded system activity yet.'}
            </p>
          </div>
        )}

      {/* Audit table */}
      {!loading &&
        filtered.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Timestamp', 'User', 'Activity', 'Entity'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

                  <tbody>
                    {filtered.map(log => (
                      <tr key={log.auditLogId} className="border-b border-gray-50">
                        {/* Timestamp */}
                        <td className="px-5 py-3 text-xs font-mono text-gray-500 whitespace-nowrap align-top">
                          {formatDate(log.createdAt)}
                        </td>

                        {/* User */}
                        <td className="px-5 py-3 align-top">
                          <p className="text-sm font-medium text-gray-800">{log.user.name}</p>
                          <p className="text-xs text-gray-400">{log.user.email}</p>
                        </td>

                        {/* Activity — action + detail, this is now the wide column */}
                        <td className="px-5 py-3 text-sm text-gray-700 align-top">
                          {formatAuditAction(log.action)}
                          {getActivityDetail(log) && (
                            <span className="text-gray-400"> — {getActivityDetail(log)}</span>
                          )}
                        </td>

                        {/* Entity — type badge + short id, combined */}
                        <td className="px-5 py-3 align-top">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                              log.entityType === 'USER'
                                ? 'bg-blue-50 text-blue-700'
                                : log.entityType === 'CASE'
                                  ? 'bg-green-50 text-green-700'
                                  : log.entityType === 'ORGANIZATIONAL_UNIT'
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {formatAuditAction(log.entityType)}
                          </span>
                          <p className="font-mono text-xs text-gray-400 mt-1" title={log.entityId}>
                            {log.entityId.slice(0, 8)}…
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  )
}
// ───────────────────────────────────────────────────────
// Roles & Permissions
// ───────────────────────────────────────────────────────

function RolesPage() {
  const roles = [
    'Records & Archive',
    'Sector',
    'Directorate',
    'Group',
    'Admin',
  ]

  const perms = [
    'View Cases',
    'Register Cases',
    'Approve',
    'Reject',
    'Transfer',
    'Upload Docs',
    'Reports',
    'User Mgmt',
  ]

  const matrix: Record<string, string[]> = {
    'Records & Archive': [
      'View Cases',
      'Register Cases',
      'Upload Docs',
    ],

    Sector: [
      'View Cases',
      'Approve',
      'Reject',
      'Transfer',
      'Upload Docs',
      'Reports',
    ],

    Directorate: [
      'View Cases',
      'Transfer',
      'Upload Docs',
      'Reports',
    ],

    Group: [
      'View Cases',
      'Upload Docs',
    ],

    Admin: [
      'View Cases',
      'User Mgmt',
      'Reports',
    ],
  }

  return (
    <div className="p-6">
      <h2
        className="text-xl font-black text-gray-900 mb-6"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Roles & Permissions
      </h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Role
                </th>

                {perms.map(p => (
                  <th
                    key={p}
                    className="text-center px-3 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {roles.map(role => (
                <tr
                  key={role}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-5 py-4 font-semibold text-gray-800">
                    {role}
                  </td>

                  {perms.map(p => (
                    <td
                      key={p}
                      className="px-3 py-4 text-center"
                    >
                      {matrix[role]?.includes(
                        p
                      ) ? (
                        <span className="text-green-500 font-bold text-base">
                          ✓
                        </span>
                      ) : (
                        <span className="text-gray-200 font-bold text-base">
                          —
                        </span>
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

// ───────────────────────────────────────────────────────
// Settings
// ───────────────────────────────────────────────────────

function SettingsPage() {
  return (
    <div className="p-6 max-w-xl space-y-5">
      <h2
        className="text-xl font-black text-gray-900"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        System Settings
      </h2>

      {[
        {
          title: 'Tracking Number Format',
          content: (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Current format:{' '}
                <span className="font-mono font-semibold text-gray-800">
                  FHC-{'{YEAR}'}-{'{SEQUENCE}'}
                </span>
              </p>

              <p className="text-xs text-gray-400">
                Example: FHC-2026-001
              </p>
            </div>
          ),
        },

        {
          title: 'Notification Settings',
          content: (
            <div className="space-y-2">
              {[
                'Enable system notifications',
                'Email notifications',
                'Case assignment alerts',
                'Delay alerts',
              ].map(s => (
                <label
                  key={s}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked={
                      s !== 'Email notifications'
                    }
                    className="rounded"
                  />

                  {s}
                </label>
              ))}
            </div>
          ),
        },

        {
          title: 'Case Settings',
          content: (
            <div className="space-y-2">
              {[
                'Enable document versioning',
                'Enable audit logging',
                'Auto-archive approved cases',
                'Delay threshold: 7 days',
              ].map(s => (
                <label
                  key={s}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />

                  {s}
                </label>
              ))}
            </div>
          ),
        },
      ].map(section => (
        <div
          key={section.title}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
        >
          <h3 className="font-bold text-gray-900 mb-3">
            {section.title}
          </h3>

          {section.content}
        </div>
      ))}

      <Btn>Save Changes</Btn>
    </div>
  )
}
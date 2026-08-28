import type { CaseStatus, Priority } from '../types'
import { useLanguage, type TKey } from '../i18n'

// ── Status Badge ───────────────────────────────────────
const statusConfig: Record<CaseStatus, { bg: string; text: string; dot: string; key: TKey }> = {
  'New':                 { bg: 'bg-sky-50',    text: 'text-sky-700',   dot: 'bg-sky-500',   key: 'status_New' },
  'Submitted':           { bg: 'bg-blue-50',   text: 'text-blue-700',  dot: 'bg-blue-500',  key: 'status_Submitted' },
  'In Progress':         { bg: 'bg-blue-50',   text: 'text-blue-700',  dot: 'bg-blue-500',  key: 'status_InProgress' },
  'Pending Clarification': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', key: 'status_PendingClarification' },
  'Returned':            { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', key: 'status_Returned' },
  'Approved':            { bg: 'bg-green-50',  text: 'text-green-700', dot: 'bg-green-500',  key: 'status_Approved' },
  'Rejected':            { bg: 'bg-red-50',    text: 'text-red-700',   dot: 'bg-red-500',   key: 'status_Rejected' },
  'Archived':            { bg: 'bg-gray-100',  text: 'text-gray-600',  dot: 'bg-gray-400',  key: 'status_Archived' },
  'Delayed':             { bg: 'bg-red-50',    text: 'text-red-700',   dot: 'bg-red-500',   key: 'status_Delayed' },
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { t } = useLanguage()
  const c = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {t(c.key)}
    </span>
  )
}

// ── Priority Badge ─────────────────────────────────────
const priorityConfig: Record<Priority, { bg: string; text: string }> = {
  High:   { bg: 'bg-red-50',    text: 'text-red-600' },
  Normal: { bg: 'bg-gray-100',  text: 'text-gray-600' },
  Low:    { bg: 'bg-green-50',  text: 'text-green-600' },
}

const priorityKeys: Record<Priority, TKey> = {
  High: 'priority_High',
  Normal: 'priority_Normal',
  Low: 'priority_Low',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useLanguage()
  const c = priorityConfig[priority]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {t(priorityKeys[priority])}
    </span>
  )
}

// ── KPI Card ───────────────────────────────────────────
interface KpiProps {
  label: string
  value: string | number
  icon: string
  accent?: string
  sub?: string
  onClick?: () => void
}

export function KpiCard({ label, value, icon, accent = '#1E4B8F', sub, onClick }: KpiProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-left w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: accent + '15' }}>
          <span>{icon}</span>
        </div>
      </div>
    </button>
  )
}

// ── Button ─────────────────────────────────────────────
interface BtnProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '' }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }
  const variants = {
    primary: 'bg-[#1E4B8F] text-white hover:bg-[#163872] focus:ring-[#1E4B8F]',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// ── Modal ──────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string
}

export function Modal({ open, onClose, title, children, width = 'max-w-md' }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Input / Textarea / Select ──────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}
export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
      <input
        className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/30 focus:border-[#1E4B8F] transition-all ${className}`}
        {...props}
      />
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}
export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
      <textarea
        rows={4}
        className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/30 focus:border-[#1E4B8F] transition-all resize-none ${className}`}
        {...props}
      />
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}
export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
      <select
        className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E4B8F]/30 focus:border-[#1E4B8F] transition-all ${className}`}
        {...props}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-3 opacity-40">{icon}</div>
      <p className="text-gray-500 font-semibold">{title}</p>
      {sub && <p className="text-gray-400 text-sm mt-1">{sub}</p>}
    </div>
  )
}

// ── Tab Bar ────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex border-b border-gray-200 mb-5">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${active === tab ? 'border-[#1E4B8F] text-[#1E4B8F]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ── Bar Chart (simple SVG) ─────────────────────────────
interface ChartData {
  month: string
  received: number
  approved: number
  rejected: number
}

export function BarChart({ data }: { data: ChartData[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.received, d.approved, d.rejected]))
  const h = 140
  const barW = 12
  const gap = 4
  const groupW = barW * 3 + gap * 2 + 16
  const totalW = data.length * groupW

  return (
    <div className="overflow-x-auto">
      <svg width={totalW} height={h + 30} style={{ minWidth: '100%' }}>
        {data.map((d, i) => {
          const x = i * groupW + 8
          const rH = (d.received / maxVal) * h
          const aH = (d.approved / maxVal) * h
          const reH = (d.rejected / maxVal) * h
          return (
            <g key={d.month}>
              <rect x={x} y={h - rH} width={barW} height={rH} rx={3} fill="#1E4B8F" opacity={0.9} />
              <rect x={x + barW + gap} y={h - aH} width={barW} height={aH} rx={3} fill="#16A34A" opacity={0.85} />
              <rect x={x + barW * 2 + gap * 2} y={h - reH} width={barW} height={reH} rx={3} fill="#DC2626" opacity={0.75} />
              <text x={x + groupW / 2 - 8} y={h + 20} fontSize={10} fill="#6B7280" textAnchor="middle">{d.month}</text>
            </g>
          )
        })}
      </svg>
      <div className="flex gap-5 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-[#1E4B8F] inline-block" />Received</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />Approved</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />Rejected</div>
      </div>
    </div>
  )
}

// ── Timeline ───────────────────────────────────────────
import type { TimelineStep } from '../types'

export function CaseTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="relative">
      {steps.map((step, idx) => (
        <div key={idx} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
              ${step.status === 'done' ? 'bg-green-500 text-white' : step.status === 'active' ? 'bg-[#1E4B8F] text-white ring-4 ring-[#1E4B8F]/20' : 'bg-gray-200 text-gray-400'}`}>
              {step.status === 'done' ? '✓' : step.status === 'active' ? '●' : '○'}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-0.5 flex-1 mt-1 ${step.status === 'done' ? 'bg-green-300' : 'bg-gray-200'}`} style={{ minHeight: 24 }} />
            )}
          </div>
          <div className="flex-1 pt-1 pb-2">
            <p className={`text-sm font-semibold ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-800'}`}>{step.stage}</p>
            {step.actor && <p className="text-xs text-gray-500 mt-0.5">{step.actor}</p>}
            {step.timestamp && <p className="text-xs text-gray-400 mt-0.5">{step.timestamp}</p>}
            {step.remark && <p className="text-xs text-gray-500 mt-1 italic bg-gray-50 rounded px-2 py-1">"{step.remark}"</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

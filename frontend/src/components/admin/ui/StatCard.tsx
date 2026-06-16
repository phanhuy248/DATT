import React from 'react'
import type { LucideIcon } from 'lucide-react'

export type StatTone = 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'teal' | 'indigo' | 'orange'

const toneMap: Record<StatTone, { icon: string; ring: string }> = {
  red:    { icon: 'bg-red-50 text-[#D70018]',         ring: 'ring-red-100/60' },
  blue:   { icon: 'bg-blue-50 text-blue-600',          ring: 'ring-blue-100/60' },
  green:  { icon: 'bg-emerald-50 text-emerald-600',    ring: 'ring-emerald-100/60' },
  amber:  { icon: 'bg-amber-50 text-amber-600',        ring: 'ring-amber-100/60' },
  purple: { icon: 'bg-violet-50 text-violet-600',      ring: 'ring-violet-100/60' },
  teal:   { icon: 'bg-teal-50 text-teal-600',          ring: 'ring-teal-100/60' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600',      ring: 'ring-indigo-100/60' },
  orange: { icon: 'bg-orange-50 text-orange-600',      ring: 'ring-orange-100/60' },
}

interface StatCardProps {
  icon: LucideIcon
  tone?: StatTone
  label: string
  value: string | number
  note?: string
  className?: string
}

export function StatCard({ icon: Icon, tone = 'blue', label, value, note, className = '' }: StatCardProps) {
  const { icon, ring } = toneMap[tone]
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ${ring} ${className}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${icon}`}>
          <Icon size={21} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
          <p className="text-2xl font-extrabold leading-none text-gray-900">{value}</p>
          {note && <p className="mt-1 truncate text-xs text-gray-400">{note}</p>}
        </div>
      </div>
    </div>
  )
}

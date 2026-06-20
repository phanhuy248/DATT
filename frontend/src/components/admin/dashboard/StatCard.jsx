import React from 'react'
import { Archive, CircleCheck, Hourglass, Receipt, ShoppingBag, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'

const iconMap = {
  archive: Archive,
  circleCheck: CircleCheck,
  hourglass: Hourglass,
  receipt: Receipt,
  shoppingBag: ShoppingBag,
  userRound: UserRound,
}

const toneMap = {
  rose: {
    card: 'border-rose-100',
    icon: 'bg-rose-100 text-[#c70039]',
    note: 'bg-emerald-50 text-emerald-700',
    value: 'text-[#1d0f0f]',
  },
  indigo: {
    card: 'border-indigo-100',
    icon: 'bg-indigo-100 text-indigo-600',
    note: 'bg-indigo-50 text-indigo-700',
    value: 'text-[#1d0f0f]',
  },
  teal: {
    card: 'border-teal-100',
    icon: 'bg-teal-100 text-teal-700',
    note: 'bg-red-50 text-red-600',
    value: 'text-[#1d0f0f]',
  },
  blue: {
    card: 'border-sky-100',
    icon: 'bg-sky-100 text-blue-600',
    note: 'bg-blue-50 text-blue-700',
    value: 'text-[#1d0f0f]',
  },
  orange: {
    card: 'border-orange-200 bg-orange-50/60',
    icon: 'bg-orange-100 text-orange-600',
    note: 'hidden',
    value: 'text-orange-700',
  },
  green: {
    card: 'border-emerald-200 bg-emerald-50/60',
    icon: 'bg-emerald-100 text-emerald-700',
    note: 'hidden',
    value: 'text-emerald-700',
  },
}

export default function StatCard({ stat, onClick }) {
  const Icon = iconMap[stat.icon]
  const tone = toneMap[stat.tone] || toneMap.rose

  return (
    <motion.article
      onClick={onClick}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.18 }}
      className={`min-h-[142px] rounded-[22px] border bg-white p-6 shadow-[0_14px_30px_rgba(37,24,24,0.10)] transition-shadow hover:shadow-[0_20px_40px_rgba(37,24,24,0.16)] ${tone.card} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="mb-8 flex items-center gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${tone.icon}`}>
          <Icon size={18} strokeWidth={2.3} />
        </span>
        {stat.note && (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold leading-none ${tone.note}`}>
            {stat.note}
          </span>
        )}
      </div>
      <p className="text-[15px] leading-5 text-[#5f403f]">{stat.label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight ${tone.value}`}>{stat.value}</p>
    </motion.article>
  )
}

import React from 'react'
import { AlertTriangle, CheckCircle2, Package, PackageCheck, PauseCircle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { productStats } from '../../mock/products'

const statStyles = {
  rose: {
    icon: Package,
    box: 'bg-rose-100 text-[#c70039]',
  },
  green: {
    icon: CheckCircle2,
    box: 'bg-emerald-100 text-emerald-700',
  },
  amber: {
    icon: AlertTriangle,
    box: 'bg-amber-100 text-amber-700',
  },
  red: {
    icon: XCircle,
    box: 'bg-red-100 text-red-700',
  },
  teal: {
    icon: PackageCheck,
    box: 'bg-teal-100 text-teal-700',
  },
  slate: {
    icon: PauseCircle,
    box: 'bg-slate-100 text-slate-500',
  },
}

export default function StatsCards() {
  return <StatsCardsView stats={productStats} />
}

export function StatsCardsView({ stats = productStats }: { stats?: typeof productStats | Array<{ id: string; label: string; value: string; tone: keyof typeof statStyles }> }) {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => {
        const style = statStyles[stat.tone]
        const Icon = style.icon

        return (
          <motion.article
            whileHover={{ y: -5 }}
            transition={{ duration: 0.18 }}
            className="flex min-h-[132px] items-center gap-5 rounded-[22px] border border-slate-100 bg-white p-7 shadow-[0_14px_30px_rgba(53,32,32,0.10)]"
            key={stat.id}
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${style.box}`}>
              <Icon size={26} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-lg font-extrabold leading-6 text-[#4a2c2b]">{stat.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-[#160b0b]">{stat.value}</p>
            </div>
          </motion.article>
        )
      })}
    </section>
  )
}

import React from 'react'
import type { ProductStatus } from '../../mock/products'

const statusStyles: Record<ProductStatus, string> = {
  'Còn hàng':    'bg-emerald-100 text-emerald-700 ring-emerald-200',
  'Sắp hết hàng':'bg-orange-100 text-orange-700 ring-orange-200',
  'Hết hàng':    'bg-red-100 text-red-700 ring-red-200',
  'Tạm dừng':    'bg-slate-100 text-slate-500 ring-slate-200',
}

export default function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={`inline-flex min-w-[96px] justify-center rounded-full px-3 py-2 text-center text-xs font-extrabold leading-4 ring-1 ${statusStyles[status]}`}>
      {status}
    </span>
  )
}

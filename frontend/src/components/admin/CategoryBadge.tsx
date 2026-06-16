import React from 'react'
import type { ProductCategory } from '../../mock/products'

const categoryStyles = {
  Laptop: 'bg-blue-50 text-blue-700 ring-blue-100',
  'Điện thoại': 'bg-violet-50 text-violet-700 ring-violet-100',
  'Phụ kiện': 'bg-orange-50 text-orange-700 ring-orange-100',
}

function getCategoryStyle(category: string) {
  const normalized = category.toLowerCase()
  if (normalized.includes('laptop') || normalized.includes('pc')) return categoryStyles.Laptop
  if (normalized.includes('điện') || normalized.includes('phone') || normalized.includes('smart')) return categoryStyles['Điện thoại']
  if (normalized.includes('phụ') || normalized.includes('audio') || normalized.includes('kiện')) return categoryStyles['Phụ kiện']
  return 'bg-slate-50 text-slate-700 ring-slate-100'
}

export default function CategoryBadge({ category }: { category: ProductCategory }) {
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${getCategoryStyle(category || 'Khác')}`}>
      {category}
    </span>
  )
}

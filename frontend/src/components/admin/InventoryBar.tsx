import React from 'react'

function getInventoryTone(stock: number, capacity: number) {
  const ratio = capacity ? stock / capacity : 0
  if (ratio === 0) return 'bg-red-500'
  if (ratio <= 0.2) return 'bg-orange-500'
  return 'bg-emerald-600'
}

export default function InventoryBar({ stock, capacity }: { stock: number; capacity: number }) {
  const percent = capacity ? Math.min(100, Math.max(0, (stock / capacity) * 100)) : 0
  const tone = getInventoryTone(stock, capacity)

  return (
    <div className="w-[86px]">
      <div className="mb-2 flex items-baseline gap-1.5 text-sm">
        <span className="font-extrabold text-[#2f1717]">{stock}</span>
        <span className="font-semibold text-[#9a7a79]">/ {capacity}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

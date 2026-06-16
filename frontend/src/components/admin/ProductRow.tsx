import React from 'react'
import { Eye, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import type { AdminProduct } from '../../mock/products'
import CategoryBadge from './CategoryBadge'
import InventoryBar from './InventoryBar'
import StatusBadge from './StatusBadge'

const actionBase = 'group relative flex h-9 w-9 items-center justify-center rounded-xl text-[#586a86] transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-[#c70039]'

function ActionButton({ label, children, danger = false, onClick }: { label: string; children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button className={`${actionBase} ${danger ? 'hover:bg-red-50 hover:text-red-600' : ''}`} onClick={onClick} type="button" aria-label={label}>
      {children}
      <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#2f1717] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  )
}

type ProductRowProps = {
  product: AdminProduct
  onView: (product: AdminProduct) => void
  onEdit: (product: AdminProduct) => void
  onDelete: (product: AdminProduct) => void
  onToggleActive: (product: AdminProduct) => void
}

export default function ProductRow({ product, onView, onEdit, onDelete, onToggleActive }: ProductRowProps) {
  return (
    <tr className={`border-t border-slate-100 transition hover:bg-[#fff8f8] ${!product.active ? 'opacity-60' : ''}`}>
      <td className="px-7 py-7">
        <div className="flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-rose-50 ring-1 ring-slate-100">
          {product.image ? (
            <img className="h-16 w-16 object-contain" src={product.image} alt={product.name} />
          ) : (
            <span className="text-xs font-extrabold text-slate-300">IMG</span>
          )}
        </div>
      </td>
      <td className="px-5 py-7">
        <div className="max-w-[220px]">
          <h3 className="text-lg font-semibold leading-7 text-[#261313]">{product.name}</h3>
          <p className="mt-1 text-sm leading-6 text-[#4a2c2b]">
            <span className="font-semibold">SKU:</span> {product.sku}
          </p>
        </div>
      </td>
      <td className="px-5 py-7">
        <CategoryBadge category={product.category} />
      </td>
      <td className="whitespace-nowrap px-5 py-7 text-lg font-semibold text-[#c70039]">{product.price}</td>
      <td className="px-5 py-7">
        <InventoryBar stock={product.stock} capacity={product.capacity} />
      </td>
      <td className="px-5 py-7 text-lg font-medium text-[#4a2c2b]">{product.sold}</td>
      <td className="px-5 py-7">
        <StatusBadge status={product.status} />
      </td>
      <td className="px-6 py-7">
        <div className="flex justify-end gap-2">
          <ActionButton label="Xem" onClick={() => onView(product)}>
            <Eye size={18} />
          </ActionButton>
          <ActionButton label="Sửa" onClick={() => onEdit(product)}>
            <Pencil size={18} />
          </ActionButton>
          <ActionButton
            label={product.active ? 'Tạm dừng' : 'Kích hoạt'}
            onClick={() => onToggleActive(product)}
          >
            {product.active ? <Pause size={18} /> : <Play size={18} />}
          </ActionButton>
          <ActionButton label="Xóa" danger onClick={() => onDelete(product)}>
            <Trash2 size={18} />
          </ActionButton>
        </div>
      </td>
    </tr>
  )
}

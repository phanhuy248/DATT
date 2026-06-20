import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function pagesToShow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  if (current <= 3) return [0, 1, 2, 3, '…', total - 1]
  if (current >= total - 4) return [0, '…', total - 4, total - 3, total - 2, total - 1]
  return [0, '…', current - 1, current, current + 1, '…', total - 1]
}

export default function Pagination({ page, pageSize, totalItems, totalPages, onPageChange, onPageSizeChange }: PaginationProps) {
  const pages = pagesToShow(page, totalPages || 1)

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-[#4a2c2b]">
        <span>Hiển thị</span>
        <select
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 font-semibold shadow-sm outline-none focus:border-[#c70039] focus:ring-4 focus:ring-rose-100"
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          value={pageSize}
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span>trên tổng số {totalItems.toLocaleString('vi-VN')} sản phẩm</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#4a2c2b] transition hover:border-[#c70039] hover:text-[#c70039] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          type="button"
          aria-label="Trang trước"
        >
          <ChevronLeft size={18} />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="flex h-11 w-8 items-center justify-center font-bold text-[#9a7a79]">
              ...
            </span>
          ) : (
            <button
              key={p}
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold transition ${p === page ? 'bg-[#c70039] text-white shadow-[0_10px_20px_rgba(199,0,57,0.24)]' : 'bg-white text-[#2f1717] hover:bg-rose-50'}`}
              onClick={() => onPageChange(p as number)}
              type="button"
            >
              {(p as number) + 1}
            </button>
          )
        )}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#4a2c2b] transition hover:border-[#c70039] hover:text-[#c70039] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={page >= (totalPages || 1) - 1}
          onClick={() => onPageChange(page + 1)}
          type="button"
          aria-label="Trang sau"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

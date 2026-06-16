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

export default function Pagination({ page, pageSize, totalItems, totalPages, onPageChange, onPageSizeChange }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages || 1, 3) }, (_, index) => index)
  const hasNext = page < Math.max(totalPages - 1, 0)

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
        {pages.map((pageIndex) => (
          <button
            key={pageIndex}
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold transition ${pageIndex === page ? 'bg-[#c70039] text-white shadow-[0_10px_20px_rgba(199,0,57,0.24)]' : 'bg-white text-[#2f1717] hover:bg-rose-50'}`}
            onClick={() => onPageChange(pageIndex)}
            type="button"
          >
            {pageIndex + 1}
          </button>
        ))}
        {totalPages > 4 && (
          <>
            <span className="px-2 font-bold text-[#9a7a79]">...</span>
            <button className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-white px-3 text-sm font-extrabold text-[#2f1717] transition hover:bg-rose-50" onClick={() => onPageChange(totalPages - 1)} type="button">
              {totalPages}
            </button>
          </>
        )}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#4a2c2b] transition hover:border-[#c70039] hover:text-[#c70039] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!hasNext}
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

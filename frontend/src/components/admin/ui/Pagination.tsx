import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number          // 0-indexed
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

function pagesToShow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  if (current <= 3)       return [0, 1, 2, 3, '…', total - 1]
  if (current >= total - 4) return [0, '…', total - 4, total - 3, total - 2, total - 1]
  return [0, '…', current - 1, current, current + 1, '…', total - 1]
}

function PBtn({ active, disabled, onClick, children }: { active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'bg-[#D70018] text-white shadow-sm'
          : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const from = totalItems === 0 ? 0 : page * pageSize + 1
  const to   = Math.min((page + 1) * pageSize, totalItems)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>
          Hiển thị{' '}
          <span className="font-semibold text-gray-800">{from}–{to}</span>{' '}
          của{' '}
          <span className="font-semibold text-gray-800">{totalItems}</span>
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D70018]/30"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} / trang</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <PBtn disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={15} />
        </PBtn>
        {pagesToShow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-gray-400">
              …
            </span>
          ) : (
            <PBtn key={p} active={p === page} onClick={() => onPageChange(p as number)}>
              {(p as number) + 1}
            </PBtn>
          )
        )}
        <PBtn disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
          <ChevronRight size={15} />
        </PBtn>
      </div>
    </div>
  )
}

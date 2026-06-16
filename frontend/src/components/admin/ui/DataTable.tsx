import React from 'react'
import { TableSkeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

export interface Column<T = any> {
  key: string
  header: string
  render?: (row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  getKey: (row: T) => string | number
  emptyMessage?: string
  emptyDescription?: string
  emptyIcon?: React.ReactNode
  skeletonRows?: number
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  columns,
  data,
  loading,
  getKey,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  skeletonRows = 5,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${col.headerClassName ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton rows={skeletonRows} cols={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  title={emptyMessage}
                  description={emptyDescription}
                  icon={emptyIcon}
                />
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={getKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-gray-100 transition-colors last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/60'}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3.5 ${col.className ?? ''}`}>
                    {col.render ? col.render(row, index) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

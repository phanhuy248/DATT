import React from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  title = 'Chưa có dữ liệu',
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        {icon ?? <Inbox size={28} />}
      </div>
      <p className="mb-1 text-sm font-semibold text-gray-700">{title}</p>
      {description && <p className="mb-4 max-w-xs text-sm text-gray-400">{description}</p>}
      {action}
    </div>
  )
}

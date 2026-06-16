import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Đã xảy ra lỗi khi tải dữ liệu', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertTriangle size={28} />
      </div>
      <p className="mb-4 text-sm text-gray-600">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCcw size={14} />
          Thử lại
        </Button>
      )}
    </div>
  )
}

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button, ButtonVariant } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
  variant?: ButtonVariant
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  description = 'Bạn có chắc muốn thực hiện thao tác này?',
  confirmLabel = 'Xác nhận',
  variant = 'danger',
  loading,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
            <AlertTriangle size={26} />
          </div>
          <p className="mb-2 text-base font-bold text-gray-900">{title}</p>
          <p className="mb-6 text-sm leading-relaxed text-gray-500">{description}</p>
          <div className="flex w-full gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button variant={variant} className="flex-1" onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

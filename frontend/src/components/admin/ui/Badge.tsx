import React from 'react'

export type BadgeVariant =
  | 'success' | 'danger' | 'warning' | 'info'
  | 'purple' | 'orange' | 'gray' | 'sky' | 'teal'

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  danger:  'bg-red-50 text-red-700 ring-red-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  info:    'bg-blue-50 text-blue-700 ring-blue-600/20',
  purple:  'bg-violet-50 text-violet-700 ring-violet-600/20',
  orange:  'bg-orange-50 text-orange-700 ring-orange-600/20',
  gray:    'bg-gray-100 text-gray-600 ring-gray-500/20',
  sky:     'bg-sky-50 text-sky-700 ring-sky-600/20',
  teal:    'bg-teal-50 text-teal-700 ring-teal-600/20',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export function ActiveBadge({ active, labelOn = 'Hoạt động', labelOff = 'Không hoạt động' }: { active: boolean; labelOn?: string; labelOff?: string }) {
  return <Badge variant={active ? 'success' : 'gray'}>{active ? labelOn : labelOff}</Badge>
}

export function PublishedBadge({ published }: { published: boolean }) {
  return <Badge variant={published ? 'success' : 'gray'}>{published ? 'Hiển thị' : 'Ẩn'}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  const variant: BadgeVariant = role === 'ADMIN' ? 'danger' : role === 'STAFF' ? 'warning' : 'info'
  return <Badge variant={variant}>{role}</Badge>
}

export const ORDER_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING:    'warning',
  CONFIRMED:  'info',
  PROCESSING: 'sky',
  SHIPPING:   'purple',
  COMPLETED:  'success',
  CANCELLED:  'danger',
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING:    'Chờ xác nhận',
  CONFIRMED:  'Đã xác nhận',
  PROCESSING: 'Đang chuẩn bị',
  SHIPPING:   'Đang giao',
  COMPLETED:  'Hoàn thành',
  CANCELLED:  'Đã hủy',
}

export const PAYMENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PAID:     'success',
  UNPAID:   'gray',
  PENDING:  'warning',
  FAILED:   'danger',
  CANCELLED:'danger',
  REFUNDED: 'info',
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID:   'Chưa thanh toán',
  PENDING:  'Chờ xác nhận',
  PAID:     'Đã thanh toán',
  FAILED:   'Thất bại',
  CANCELLED:'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
}

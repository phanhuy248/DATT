import React from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#D70018] text-white shadow-sm hover:bg-[#b5001a] focus-visible:ring-[#D70018]',
  secondary:
    'bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 focus-visible:ring-gray-400',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-600',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm:   'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md:   'h-9 px-4 text-sm gap-2 rounded-lg',
  lg:   'h-10 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
      {children}
    </button>
  )
}

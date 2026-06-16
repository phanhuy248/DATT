import React from 'react'

const baseInput =
  'w-full rounded-lg border bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500'

const normalBorder = 'border-gray-300 hover:border-gray-400 focus:ring-[#D70018]/30'
const errorBorder  = 'border-red-400 focus:ring-red-400/30'

// ── Input ──────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', required, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <input
        required={required}
        className={`h-9 ${baseInput} ${error ? errorBorder : normalBorder} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

// ── Textarea ───────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', required, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <textarea
        required={required}
        className={`${baseInput} py-2 ${error ? errorBorder : normalBorder} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Select ─────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, children, className = '', required, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <select
        required={required}
        className={`h-9 ${baseInput} ${error ? errorBorder : normalBorder} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Switch ─────────────────────────────────────────────────────────────────────

interface SwitchProps {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ label, checked, onChange, disabled }: SwitchProps) {
  return (
    <label className={`flex items-center gap-2.5 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D70018]/40 ${checked ? 'bg-[#D70018]' : 'bg-gray-300'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
      {label && <span className="select-none text-sm text-gray-700">{label}</span>}
    </label>
  )
}

// ── Checkbox ───────────────────────────────────────────────────────────────────

interface CheckboxProps {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Checkbox({ label, checked, onChange, disabled }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 accent-[#D70018]"
      />
      {label && <span className="select-none text-sm text-gray-700">{label}</span>}
    </label>
  )
}

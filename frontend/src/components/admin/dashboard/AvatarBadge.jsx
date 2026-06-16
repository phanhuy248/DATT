import React from 'react'

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(-2)
    .toUpperCase()
}

export default function AvatarBadge({ name, tone = 'from-rose-200 to-slate-700', size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-9 w-9 text-[10px]' : 'h-14 w-14 text-sm'

  return (
    <div className={`${sizeClass} shrink-0 rounded-full border-2 border-white bg-gradient-to-br ${tone} shadow-[0_8px_18px_rgba(61,31,31,0.16)] ring-1 ring-rose-100 flex items-center justify-center font-extrabold text-white`}>
      {getInitials(name)}
    </div>
  )
}

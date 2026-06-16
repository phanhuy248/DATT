import React from 'react'
import { Bell, ExternalLink, Menu, Settings } from 'lucide-react'
import { getImageUrl } from '../../utils/image'

type AdminHeaderProps = {
  user?: { fullName?: string; avatar?: string } | null
  onMenuClick: () => void
}

export default function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[64px] shrink-0 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur-xl lg:px-6">
      {/* Mobile hamburger */}
      <button
        aria-label="Mở sidebar"
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 lg:hidden"
      >
        <Menu size={19} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Xem website"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-[#c70039] shadow-sm transition hover:bg-red-50"
        >
          <ExternalLink size={14} strokeWidth={2.2} />
          <span className="hidden sm:inline">Website</span>
        </a>

        {[
          { label: 'Thông báo', icon: Bell },
          { label: 'Cài đặt',   icon: Settings },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            aria-label={label}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <Icon size={18} strokeWidth={2} />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-7 w-px bg-gray-200" />

      {/* User */}
      <div className="flex items-center gap-2.5">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold leading-5 text-gray-900">{user?.fullName || 'Administrator'}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c70039]">Admin</p>
        </div>
        <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-rose-200 shadow-sm">
          {user?.avatar ? (
            <img
              className="h-full w-full object-cover"
              src={getImageUrl(user.avatar)}
              alt="Administrator"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#3b2525] to-[#c70039] text-xs font-extrabold text-white">
              AD
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

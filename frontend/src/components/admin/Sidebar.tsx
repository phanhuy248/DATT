import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  BadgePercent,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Factory,
  Gauge,
  Grid3X3,
  Image,
  LogOut,
  Mail,
  Package,
  ShoppingCart,
  UsersRound,
  Zap,
} from 'lucide-react'

const mainItems = [
  { to: '/admin/dashboard',  label: 'Dashboard',       icon: Gauge },
  { to: '/admin/products',   label: 'Sản phẩm',        icon: Package },
  { to: '/admin/categories', label: 'Danh mục',        icon: Grid3X3 },
  { to: '/admin/suppliers',  label: 'Nhà cung cấp',    icon: Factory },
  { to: '/admin/orders',     label: 'Đơn hàng',        icon: ShoppingCart },
  { to: '/admin/users',      label: 'Khách hàng',      icon: UsersRound },
]

const contentItems = [
  { to: '/admin/flash-sales', label: 'Flash Sale',  icon: Zap },
  { to: '/admin/coupons',     label: 'Khuyến mãi',  icon: BadgePercent },
  { to: '/admin/banners',     label: 'Banner',      icon: Image },
  { to: '/admin/posts',       label: 'Bài viết',    icon: BookOpen },
  { to: '/admin/contacts',    label: 'Liên hệ',     icon: Mail },
]

type SidebarProps = {
  isOpen: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
  onLogout: () => void
}

type LinkProps = {
  to: string
  label: string
  icon: React.ElementType
  onClose: () => void
  collapsed: boolean
}

function SidebarLink({ to, label, icon: Icon, onClose, collapsed }: LinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative mx-2 mb-0.5 flex h-10 items-center rounded-xl transition-all duration-150 ${
          collapsed ? 'justify-center px-0' : 'gap-3 px-3'
        } ${
          isActive
            ? 'bg-[#c70039] text-white shadow-[0_8px_20px_rgba(199,0,57,0.28)]'
            : 'text-white/65 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={2.2} className="shrink-0" />
          {!collapsed && (
            <span className="truncate text-sm font-medium">{label}</span>
          )}
          {/* Tooltip when collapsed */}
          {collapsed && (
            <div className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="mx-2 my-3 border-t border-white/10" />
  return (
    <p className="mb-1 mt-5 px-5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
      {children}
    </p>
  )
}

export default function Sidebar({ isOpen, collapsed, onClose, onToggleCollapse, onLogout }: SidebarProps) {
  const w = collapsed ? 'w-[68px]' : 'w-[260px]'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          aria-label="Đóng sidebar"
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-[#3b2525] text-white shadow-[8px_0_24px_rgba(0,0,0,0.18)] transition-all duration-300 lg:sticky lg:top-0 lg:z-20 lg:translate-x-0 ${w} ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className={`flex shrink-0 items-center border-b border-white/8 py-5 ${collapsed ? 'justify-center px-2' : 'gap-3 px-5'}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c70039] shadow-[0_6px_16px_rgba(199,0,57,0.35)]">
            <Zap fill="currentColor" size={17} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-5 tracking-tight">SmartShop</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/45">
                Enterprise Admin
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <SectionLabel collapsed={collapsed}>Quản lý</SectionLabel>
          {mainItems.map((item) => (
            <SidebarLink key={item.to} {...item} onClose={onClose} collapsed={collapsed} />
          ))}

          <SectionLabel collapsed={collapsed}>Nội dung</SectionLabel>
          {contentItems.map((item) => (
            <SidebarLink key={item.to} {...item} onClose={onClose} collapsed={collapsed} />
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-2 pb-3 pt-5">
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? 'Đăng xuất' : undefined}
            className={`group relative flex h-9 w-full items-center rounded-xl border border-[#ff7070]/40 text-[#ff7070] transition hover:border-[#ff7070]/70 hover:bg-[#ff7070]/10 hover:text-[#ff9090] ${
              collapsed ? 'justify-center' : 'gap-2.5 px-3'
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Đăng xuất</span>}
            {collapsed && (
              <div className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">
                Đăng xuất
              </div>
            )}
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-1 hidden h-8 w-full items-center justify-center rounded-xl text-white/30 transition hover:bg-white/8 hover:text-white/70 lg:flex"
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </aside>
    </>
  )
}

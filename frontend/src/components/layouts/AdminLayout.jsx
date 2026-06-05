import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getImageUrl } from '../../utils/image'

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: 'fa-gauge', label: 'Dashboard' },
  { to: '/admin/products', icon: 'fa-box', label: 'Sản phẩm' },
  { to: '/admin/categories', icon: 'fa-tags', label: 'Danh mục' },
  { to: '/admin/suppliers', icon: 'fa-truck-field', label: 'Nhà cung cấp' },
  { to: '/admin/orders', icon: 'fa-receipt', label: 'Đơn hàng' },
  { to: '/admin/coupons', icon: 'fa-ticket', label: 'Khuyến mãi' },
  { to: '/admin/banners', icon: 'fa-images', label: 'Banner' },
  { to: '/admin/posts', icon: 'fa-newspaper', label: 'Tin tức' },
  { to: '/admin/contacts', icon: 'fa-inbox', label: 'Liên hệ' },
  { to: '/admin/users', icon: 'fa-users', label: 'Người dùng' },
]

export default function AdminLayout() {
  const { user, signOut, refreshCurrentUser } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { signOut(); navigate('/admin/login') }

  useEffect(() => {
    let active = true
    refreshCurrentUser()
      .then(currentUser => {
        if (active && currentUser.role !== 'ADMIN') {
          signOut()
          navigate('/admin/login', { replace: true })
        }
      })
      .catch(() => {
        if (active) {
          signOut()
          navigate('/admin/login', { replace: true })
        }
      })
    return () => { active = false }
  }, [])

  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F8' }}>
      {mobileOpen && <button className="admin-mobile-overlay" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}
      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`} style={{
        width: collapsed ? 64 : 240, background: '#071A2D', color: '#E5E7EB',
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(229,231,235,0.14)' }}>
          <i className="fa-solid fa-bolt" style={{ color: '#D70018', fontSize: 20 }} />
          {(!collapsed || mobileOpen) && <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>SmartShop</span>}
          <button className="desktop-only" onClick={() => setCollapsed(!collapsed)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#E5E7EB', cursor: 'pointer' }}>
            <i className={`fa-solid fa-${collapsed ? 'angle-right' : 'angle-left'}`} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
              color: isActive ? '#fff' : '#E5E7EB', background: isActive ? '#D70018' : 'transparent',
              borderRadius: 12, margin: '2px 8px', textDecoration: 'none', fontSize: 14,
              transition: 'all 0.15s',
            })}>
              <i className={`fa-solid ${icon}`} style={{ width: 16, textAlign: 'center' }} />
              {(!collapsed || mobileOpen) && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid rgba(229,231,235,0.14)' }}>
          {(!collapsed || mobileOpen) && <p style={{ fontSize: 12, color: '#E5E7EB', marginBottom: 8 }}>{user?.email}</p>}
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', background: '#DC2626', color: '#fff',
            border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <i className="fa-solid fa-arrow-right-from-bracket" />
            {(!collapsed || mobileOpen) && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="admin-header" style={{
          height: 56, background: '#fff', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <button className="btn btn-secondary btn-sm mobile-only" onClick={() => setMobileOpen(true)} aria-label="Mở menu admin">
            <i className="fa-solid fa-bars" />
          </button>
          <span className="admin-header-title" style={{ fontWeight: 700, color: '#111827' }}>Admin Panel</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              to="/"
              className="btn btn-secondary btn-sm admin-website-link"
              style={{ textDecoration: 'none', background: '#F4F6F8', border: '1px solid #E5E7EB' }}
            >
              <i className="fa-solid fa-house" />
              <span>Về website</span>
            </Link>
            <div style={{ width: 32, height: 32, borderRadius: 12, overflow: 'hidden', background: '#EAF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user?.avatar
                ? <img src={getImageUrl(user.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <i className="fa-solid fa-user" style={{ color: '#071A2D', fontSize: 14 }} />}
            </div>
            <span className="admin-header-user-name" style={{ fontSize: 14, color: '#6B7280' }}>{user?.fullName}</span>
          </div>
        </header>
        <main className="admin-main" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

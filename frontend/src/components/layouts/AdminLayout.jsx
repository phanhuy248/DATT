import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getImageUrl } from '../../utils/image'

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: 'fa-gauge', label: 'Dashboard' },
  { to: '/admin/products', icon: 'fa-box', label: 'Sản phẩm' },
  { to: '/admin/categories', icon: 'fa-tags', label: 'Danh mục' },
  { to: '/admin/suppliers', icon: 'fa-truck-field', label: 'Nhà cung cấp' },
  { to: '/admin/orders', icon: 'fa-receipt', label: 'Đơn hàng' },
  { to: '/admin/coupons', icon: 'fa-ticket', label: 'Khuyến mãi' },
  { to: '/admin/posts', icon: 'fa-newspaper', label: 'Tin tức' },
  { to: '/admin/users', icon: 'fa-users', label: 'Người dùng' },
]

export default function AdminLayout() {
  const { user, signOut, refreshCurrentUser } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240, background: '#1e293b', color: '#cbd5e1',
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #334155' }}>
          <i className="fa-solid fa-bolt" style={{ color: '#60a5fa', fontSize: 20 }} />
          {!collapsed && <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>SmartShop</span>}
          <button onClick={() => setCollapsed(!collapsed)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <i className={`fa-solid fa-${collapsed ? 'angle-right' : 'angle-left'}`} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
              color: isActive ? '#fff' : '#94a3b8', background: isActive ? '#2563eb' : 'transparent',
              borderRadius: 6, margin: '2px 8px', textDecoration: 'none', fontSize: 14,
              transition: 'all 0.15s',
            })}>
              <i className={`fa-solid ${icon}`} style={{ width: 16, textAlign: 'center' }} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid #334155' }}>
          {!collapsed && <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{user?.email}</p>}
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', background: '#dc2626', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <i className="fa-solid fa-arrow-right-from-bracket" />
            {!collapsed && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: 56, background: '#fff', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>Admin Panel</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user?.avatar
                ? <img src={getImageUrl(user.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <i className="fa-solid fa-user" style={{ color: '#2563eb', fontSize: 14 }} />}
            </div>
            <span style={{ fontSize: 14, color: '#475569' }}>{user?.fullName}</span>
          </div>
        </header>
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

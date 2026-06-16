import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminHeader from '../admin/AdminHeader'
import Sidebar from '../admin/Sidebar'

export default function AdminLayout() {
  const { user, signOut, refreshCurrentUser } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    signOut()
    navigate('/admin/login', { replace: true })
  }

  useEffect(() => {
    let active = true
    refreshCurrentUser()
      .then((currentUser) => {
        if (active && currentUser.role !== 'ADMIN') {
          signOut()
          navigate('/admin/login', { replace: true })
        }
      })
      .catch((err) => {
        if (!active) return
        // Chỉ logout khi server xác nhận token không hợp lệ (401/403)
        // Lỗi mạng tạm thời không nên xóa session
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          signOut()
          navigate('/admin/login', { replace: true })
        }
      })
    return () => { active = false }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

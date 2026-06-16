import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ requiredRole }) {
  const { user, loading } = useAuth()
  // Không redirect trong khi auth đang xử lý (login / refresh token)
  if (loading) return null
  if (!user) return <Navigate to={requiredRole === 'ADMIN' ? '/admin/login' : '/login'} replace />
  if (requiredRole && user.role !== requiredRole) return <Navigate to={requiredRole === 'ADMIN' ? '/admin/login' : '/'} replace />
  return <Outlet />
}

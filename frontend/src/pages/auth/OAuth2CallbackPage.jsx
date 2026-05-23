import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

export default function OAuth2CallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)
  const { completeOAuthLogin } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const queryParams = new URLSearchParams(window.location.search)
    const fragmentParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const providerError = queryParams.get('error')
    const accessToken = fragmentParams.get('accessToken')
    const refreshToken = fragmentParams.get('refreshToken')

    if (providerError) {
      const message = providerError === 'google_oauth_not_configured'
        ? 'Backend chưa có GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET thật.'
        : 'Không thể đăng nhập bằng Google. Vui lòng thử lại.'
      setError(message)
      toast.error(message)
      return
    }

    if (!accessToken) {
      setError('Thiếu JWT từ máy chủ OAuth2.')
      toast.error('Thiếu JWT từ máy chủ OAuth2')
      return
    }

    completeOAuthLogin(accessToken, refreshToken)
      .then(() => {
        toast.success('Đăng nhập Google thành công!')
        navigate('/', { replace: true })
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Không thể hoàn tất đăng nhập Google.')
        toast.error('Không thể hoàn tất đăng nhập Google')
      })
  }, [completeOAuthLogin, navigate])

  if (error) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="card" style={{ width: '100%', maxWidth: 420 }}>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 34, color: '#dc2626', marginBottom: 12 }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Đăng nhập Google thất bại</h1>
            <p className="text-muted text-sm" style={{ marginBottom: 20 }}>{error}</p>
            <Link to="/login" className="btn btn-primary">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#374151' }}>
        <i className="fa-solid fa-spinner fa-spin" />
        <span>Đang hoàn tất đăng nhập Google...</span>
      </div>
    </div>
  )
}

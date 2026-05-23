import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

export default function OAuth2CompleteProfilePage() {
  const navigate = useNavigate()
  const { completeGoogleProfile, loading } = useAuth()
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' })
  const [errors, setErrors] = useState({})
  const [tokenMissing, setTokenMissing] = useState(false)

  const token = useMemo(() => {
    const queryParams = new URLSearchParams(window.location.search)
    const fragmentParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    return fragmentParams.get('token') || queryParams.get('token') || ''
  }, [])

  useEffect(() => {
    if (!token) setTokenMissing(true)
  }, [token])

  const validate = () => {
    const e = {}
    if (!form.fullName.trim() || form.fullName.trim().length < 3) e.fullName = 'Họ tên ít nhất 3 ký tự'
    if (!form.phone.trim()) e.phone = 'Số điện thoại không được để trống'
    if (!form.address.trim()) e.address = 'Địa chỉ không được để trống'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    try {
      await completeGoogleProfile({
        token,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      })
      toast.success('Hoàn tất hồ sơ và đăng nhập thành công!')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hoàn tất hồ sơ Google')
    }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-control"
        value={form[key]}
        placeholder={placeholder}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        disabled={loading}
      />
      {errors[key] && <p className="form-error">{errors[key]}</p>}
    </div>
  )

  if (tokenMissing) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="card" style={{ width: '100%', maxWidth: 420 }}>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 34, color: '#dc2626', marginBottom: 12 }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Thiếu phiên Google</h1>
            <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
              Vui lòng đăng nhập lại bằng Google để hoàn tất hồ sơ.
            </p>
            <Link to="/login" className="btn btn-primary">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <i className="fa-brands fa-google" style={{ fontSize: 30, color: '#ea4335', marginBottom: 10 }} />
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>Hoàn tất thông tin</h1>
              <p className="text-muted text-sm mt-1" style={{ margin: 0 }}>
                Bổ sung thông tin giao hàng trước khi đăng nhập SmartShop.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {field('fullName', 'Họ và tên', 'text', 'Nguyễn Văn A')}
              {field('phone', 'Số điện thoại', 'tel', '0912345678')}
              {field('address', 'Địa chỉ', 'text', '123 Đường ABC, TP.HCM')}
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Đang hoàn tất...</> : 'Hoàn tất và đăng nhập'}
              </button>
            </form>

            <p className="text-sm text-muted mt-4" style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#6b7280' }}>Hủy và quay lại đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

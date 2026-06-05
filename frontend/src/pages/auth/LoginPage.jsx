import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { getGoogleLoginUrl } from '../../api/auth'
import BrandLogo from '../../components/common/BrandLogo'

export default function LoginPage() {
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email không được để trống'
    if (!form.password) e.password = 'Mật khẩu không được để trống'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      const user = await signIn(form.email.trim(), form.password)
      toast.success('Đăng nhập thành công!')
      navigate('/')
    } catch (err) {
      if (!err.response) {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.')
      } else {
        toast.error(err.response?.data?.message || 'Email hoặc mật khẩu không đúng')
      }
    }
  }

  const handleGoogleLogin = () => {
    window.location.assign(getGoogleLoginUrl())
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="mb-3 flex justify-center">
                <BrandLogo iconClassName="h-12 w-12 rounded-2xl" textClassName="text-2xl" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>Đăng nhập SmartShop</h1>
              <p className="text-muted text-sm mt-1">Chào mừng bạn trở lại!</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" placeholder="your@email.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input type="password" className="form-control" placeholder="••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Đang xử lý...</> : 'Đăng nhập'}
              </button>
            </form>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Hoặc</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>
            <button type="button" className="btn btn-full btn-lg" onClick={handleGoogleLogin}
              style={{ background: '#fff', border: '1px solid #E5E7EB', color: '#111827', justifyContent: 'center' }}>
              <i className="fa-brands fa-google" style={{ color: '#D70018' }} />
              Đăng nhập với Google
            </button>
            <p className="text-sm text-muted mt-4" style={{ textAlign: 'center' }}>
              Chưa có tài khoản? <Link to="/register" style={{ color: '#D70018', fontWeight: 700 }}>Đăng ký ngay</Link>
            </p>
            <p className="text-sm mt-2" style={{ textAlign: 'center' }}>
              <Link to="/forgot-password" style={{ color: '#D70018', fontWeight: 700 }}>Quên mật khẩu?</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

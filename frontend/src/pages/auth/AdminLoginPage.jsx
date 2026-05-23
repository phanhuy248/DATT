import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

export default function AdminLoginPage() {
  const { signIn, signOut, loading } = useAuth()
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
      const user = await signIn(form.email, form.password)
      if (user.role !== 'ADMIN') {
        signOut()
        toast.error('Tài khoản của bạn không có quyền truy cập trang quản trị.')
        return
      }
      toast.success('Đăng nhập thành công!')
      navigate('/admin/dashboard')
    } catch (err) {
      if (!err.response) {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.')
      } else {
        toast.error(err.response?.data?.message || 'Email hoặc mật khẩu không đúng')
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#f1f5f9' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, background: '#1e293b', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: 24, color: '#60a5fa' }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin Panel</h1>
              <p className="text-muted text-sm mt-1">Chỉ dành cho quản trị viên</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" placeholder="admin@email.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input type="password" className="form-control" placeholder="••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
                style={{ background: '#1e293b', borderColor: '#1e293b' }}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Đang xử lý...</> : <><i className="fa-solid fa-right-to-bracket" style={{ marginRight: 6 }} />Đăng nhập Admin</>}
              </button>
            </form>
            <p className="text-sm text-muted mt-4" style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#6b7280' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: 4 }} />
                Quay lại trang đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

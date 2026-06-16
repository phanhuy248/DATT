import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '../../api/auth'
import { toast } from 'react-toastify'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const token = params.get('token') || ''
  const submit = async e => {
    e.preventDefault(); setLoading(true)
    try { await resetPassword(token, password); toast.success('Đặt lại mật khẩu thành công'); navigate('/login') }
    catch (err) { toast.error(err.response?.data?.message || 'Không thể đặt lại mật khẩu') }
    finally { setLoading(false) }
  }
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body">
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Đặt lại mật khẩu</h1>
          <form onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="reset-new-password" className="form-label">Mật khẩu mới</label>
              <input id="reset-new-password" type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading || !token}>
              {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

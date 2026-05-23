import React, { useState } from 'react'
import { forgotPassword } from '../../api/auth'
import { toast } from 'react-toastify'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async e => {
    e.preventDefault(); setLoading(true)
    try { await forgotPassword(email); toast.success('Nếu email tồn tại, hệ thống đã gửi liên kết đặt lại mật khẩu') }
    catch (err) { toast.error(err.response?.data?.message || 'Không thể gửi yêu cầu') }
    finally { setLoading(false) }
  }
  return <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}><div className="card" style={{ width: '100%', maxWidth: 420 }}><div className="card-body"><h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Quên mật khẩu</h1><form onSubmit={submit}><div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} /></div><button className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi liên kết'}</button></form></div></div></div>
}

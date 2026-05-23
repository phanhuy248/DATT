import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { updateProfile, uploadAvatar } from '../../api/users'
import { toast } from 'react-toastify'
import { getImageUrl } from '../../utils/image'

export default function AccountPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: user?.fullName || '', address: user?.address || '', phone: user?.phone || '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateProfile(form)
      updateUser(updated)
      toast.success('Cập nhật thành công!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    } finally { setSaving(false) }
  }

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const updated = await uploadAvatar(file)
      updateUser(updated)
      toast.success('Cập nhật ảnh thành công!')
    } catch { toast.error('Không thể tải ảnh lên') }
    finally { setUploading(false) }
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 40, maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          <i className="fa-solid fa-user-circle" style={{ marginRight: 10, color: '#2563eb' }} />
          Tài khoản của tôi
        </h1>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#6b7280', textDecoration: 'none', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc' }}>
          <i className="fa-solid fa-arrow-left" />
          Quay lại trang chủ
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Ảnh đại diện</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dbeafe', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user?.avatar
                ? <img src={getImageUrl(user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <i className="fa-solid fa-user" style={{ fontSize: 32, color: '#2563eb' }} />}
            </div>
            <div>
              <label style={{ display: 'inline-block', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                {uploading ? <><i className="fa-solid fa-spinner fa-spin" /> Đang tải...</> : <><i className="fa-solid fa-upload" style={{ marginRight: 6 }} />Đổi ảnh</>}
                <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
              </label>
              <p style={{ marginTop: 6, fontSize: 12, color: '#9ca3af' }}>PNG, JPG tối đa 5MB</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Thông tin tài khoản</h3>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" value={user?.email || ''} disabled style={{ background: '#f8fafc', color: '#6b7280' }} />
            <p className="form-error" style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>Email không thể thay đổi</p>
          </div>
          <div className="form-group">
            <label className="form-label">Vai trò</label>
            <input className="form-control" value={user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'} disabled style={{ background: '#f8fafc', color: '#6b7280' }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Chỉnh sửa thông tin</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Họ và tên *</label>
              <input className="form-control" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại *</label>
              <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Địa chỉ *</label>
              <textarea className="form-control" rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Đang lưu...</> : <><i className="fa-solid fa-floppy-disk" /> Lưu thay đổi</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

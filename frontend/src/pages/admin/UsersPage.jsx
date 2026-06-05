import React, { useEffect, useState } from 'react'
import { getAllUsers, createUser, updateUser, deleteUser } from '../../api/users'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { getImageUrl } from '../../utils/image'

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', address: '', phone: '', role: 'USER', active: true })

  const load = () => {
    setLoading(true)
    setError('')
    return getAllUsers()
      .then(setUsers)
      .catch(err => {
        const message = err.response?.data?.message || 'Không thể tải danh sách người dùng'
        setUsers([])
        setError(message)
        toast.error(message)
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id, email) => {
    if (id === me?.id) { toast.error('Không thể xóa tài khoản đang đăng nhập'); return }
    if (!confirm(`Xóa tài khoản "${email}"?`)) return
    try { await deleteUser(id); toast.success('Đã xóa người dùng'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Không thể xóa') }
  }

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm({ email: '', password: '', fullName: '', address: '', phone: '', role: 'USER', active: true })
    setModal({ mode: 'create' })
  }

  const openEdit = (u) => {
    setForm({ email: u.email, password: '', fullName: u.fullName, address: u.address || '', phone: u.phone || '', role: u.role || 'USER', active: u.active !== false })
    setModal({ mode: 'edit', data: u })
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      modal.mode === 'create' ? await createUser(form) : await updateUser(modal.data.id, form)
      toast.success('Đã lưu tài khoản')
      setModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Không thể lưu') }
  }

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý người dùng</h1>
        <div className="admin-page-actions" style={{ display: 'flex', gap: 8 }}>
          <input className="form-control" style={{ width: 240 }} placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={openCreate}><i className="fa-solid fa-plus" /> Thêm</button>
        </div>
      </div>

      {loading ? <div className="spinner" /> : error ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 40, color: '#ef4444', marginBottom: 16 }} />
          <p style={{ color: '#374151', fontSize: 15, marginBottom: 16 }}>{error}</p>
          <button className="btn btn-primary" onClick={load}>
            <i className="fa-solid fa-rotate-right" /> Thử lại
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="admin-table-card" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  {['ID', 'Họ tên', 'Email', 'Điện thoại', 'Vai trò', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Không tìm thấy người dùng</td></tr>
                  : filtered.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td data-label="ID" style={{ padding: '12px 16px', color: '#6b7280' }}>#{u.id}</td>
                      <td data-label="Họ tên" style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {u.avatar
                              ? <img src={getImageUrl(u.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <i className="fa-solid fa-user" style={{ color: '#2563eb', fontSize: 14 }} />}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.fullName}</span>
                        </div>
                      </td>
                      <td data-label="Email" style={{ padding: '12px 16px', color: '#6b7280' }}>{u.email}</td>
                      <td data-label="Điện thoại" style={{ padding: '12px 16px', color: '#6b7280' }}>{u.phone || '—'}</td>
                      <td data-label="Vai trò" style={{ padding: '12px 16px' }}>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : 'badge-info'}`}>{u.role}</span>
                      </td>
                      <td data-label="Thao tác" style={{ padding: '12px 16px' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.email)} disabled={u.id === me?.id}>
                          <i className="fa-solid fa-trash" />
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)} style={{ marginLeft: 6 }}>
                          <i className="fa-solid fa-pen" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#6b7280' }}>
            Tổng: {filtered.length} người dùng
          </div>
        </div>
      )}
      {modal && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 520 }}>
            <div className="card-body">
              <h2 style={{ fontWeight: 700, marginBottom: 16 }}>{modal.mode === 'create' ? 'Thêm tài khoản' : 'Sửa tài khoản'}</h2>
              <form onSubmit={save}>
                <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Họ tên</label><input className="form-control" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Số điện thoại</label><input className="form-control" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Địa chỉ</label><input className="form-control" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Mật khẩu {modal.mode === 'edit' && '(để trống nếu không đổi)'}</label><input type="password" className="form-control" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Vai trò</label><select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="USER">USER</option><option value="STAFF">STAFF</option><option value="ADMIN">ADMIN</option></select></div>
                <label style={{ display: 'flex', gap: 8, marginBottom: 16 }}><input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Hoạt động</label>
                <div className="admin-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary">Lưu</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

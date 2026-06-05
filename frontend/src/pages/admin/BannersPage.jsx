import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { createBanner, deleteBanner, getAdminBanners, updateBanner } from '../../api/banners'
import { getImageUrl } from '../../utils/image'

const EMPTY = { title: '', subtitle: '', image: '', linkUrl: '/products', sortOrder: 0, active: true }

export default function AdminBannersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const load = () => {
    setLoading(true)
    getAdminBanners()
      .then(setItems)
      .catch(err => toast.error(err.response?.data?.message || 'Không thể tải banner'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }) }
  const openEdit = (item) => { setForm({ ...EMPTY, ...item }); setModal({ mode: 'edit', data: item }) }

  const save = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề banner'); return }
    setSaving(true)
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder || 0) }
      if (modal.mode === 'create') await createBanner(payload)
      else await updateBanner(modal.data.id, payload)
      toast.success('Đã lưu banner')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu banner')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!confirm(`Xóa banner "${item.title}"?`)) return
    try {
      await deleteBanner(item.id)
      toast.success('Đã xóa banner')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa banner')
    }
  }

  return (
    <div>
      <div className="admin-page-header flex-between" style={{ marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý banner</h1>
          <p className="text-muted text-sm">Điều khiển các banner hiển thị trên trang chủ.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="fa-solid fa-plus" /> Thêm banner
        </button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="card">
          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="admin-table-card" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Ảnh', 'Nội dung', 'Liên kết', 'Thứ tự', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có banner</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td data-label="Ảnh" style={{ padding: '10px 14px' }}>
                      <div style={{ width: 120, height: 58, borderRadius: 6, overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        {item.image
                          ? <img src={getImageUrl(item.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><i className="fa-solid fa-image" /></div>}
                      </div>
                    </td>
                    <td data-label="Nội dung" style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700 }}>{item.title}</div>
                      <div className="text-muted text-sm" style={{ maxWidth: 380 }}>{item.subtitle}</div>
                    </td>
                    <td data-label="Liên kết" style={{ padding: '10px 14px', color: '#2563eb' }}>{item.linkUrl || '-'}</td>
                    <td data-label="Thứ tự" style={{ padding: '10px 14px' }}>{item.sortOrder}</td>
                    <td data-label="Trạng thái" style={{ padding: '10px 14px' }}>
                      <span className={`badge ${item.active ? 'badge-success' : 'badge-secondary'}`}>
                        {item.active ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td data-label="Thao tác" style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}><i className="fa-solid fa-pen" /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(item)}><i className="fa-solid fa-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 680 }}>
            <div className="card-body">
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>{modal.mode === 'create' ? 'Thêm banner' : 'Sửa banner'}</h2>
                <button onClick={() => setModal(null)} style={{ border: 0, background: 'transparent', fontSize: 22, color: '#64748b' }}>×</button>
              </div>
              <form onSubmit={save}>
                <div className="admin-modal-grid grid grid-2">
                  <Field label="Tiêu đề" value={form.title} onChange={value => setForm({ ...form, title: value })} required />
                  <Field label="Liên kết" value={form.linkUrl} onChange={value => setForm({ ...form, linkUrl: value })} />
                  <Field label="Ảnh URL hoặc đường dẫn upload" value={form.image} onChange={value => setForm({ ...form, image: value })} />
                  <Field label="Thứ tự" type="number" value={form.sortOrder} onChange={value => setForm({ ...form, sortOrder: value })} />
                </div>
                <Field label="Mô tả ngắn" textarea value={form.subtitle} onChange={value => setForm({ ...form, subtitle: value })} />
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                  <input type="checkbox" checked={!!form.active} onChange={event => setForm({ ...form, active: event.target.checked })} />
                  Hiển thị banner
                </label>
                {form.image && (
                  <div style={{ marginBottom: 16, height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <img src={getImageUrl(form.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="admin-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button>
                  <button className="btn btn-primary" disabled={saving}>
                    {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Đang lưu...</> : 'Lưu banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', textarea = false, required = false }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && ' *'}</label>
      {textarea
        ? <textarea className="form-control" rows={3} value={value || ''} onChange={event => onChange(event.target.value)} />
        : <input className="form-control" type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} />}
    </div>
  )
}

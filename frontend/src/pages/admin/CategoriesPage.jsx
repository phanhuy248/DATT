import React, { useEffect, useState } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories'
import { toast } from 'react-toastify'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | { mode:'create'|'edit', data? }
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = () => getCategories().then(setCategories).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm({ name: '', description: '' }); setModal({ mode: 'create' }) }
  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '' }); setModal({ mode: 'edit', data: cat }) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Tên danh mục không được để trống'); return }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createCategory(form)
        toast.success('Tạo danh mục thành công!')
      } else {
        await updateCategory(modal.data.id, form)
        toast.success('Cập nhật danh mục thành công!')
      }
      setModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Thao tác thất bại') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa danh mục "${name}"?`)) return
    try { await deleteCategory(id); toast.success('Đã xóa danh mục'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Không thể xóa') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý danh mục</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="fa-solid fa-plus" /> Thêm danh mục
        </button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  {['ID', 'Tên danh mục', 'Mô tả', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.length === 0
                  ? <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chưa có danh mục</td></tr>
                  : categories.map(cat => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>#{cat.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{cat.name}</td>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>{cat.description || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat)}>
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat.id, cat.name)}>
                            <i className="fa-solid fa-trash" />
                          </button>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 440 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>
                  {modal.mode === 'create' ? 'Thêm danh mục' : 'Chỉnh sửa danh mục'}
                </h2>
                <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>×</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Tên danh mục *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu'}
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

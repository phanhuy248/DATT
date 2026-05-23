import React, { useEffect, useState } from 'react'
import { getAdminPosts, createPost, updatePost, deletePost } from '../../api/posts'
import { toast } from 'react-toastify'

const EMPTY = { title: '', slug: '', summary: '', content: '', thumbnail: '', published: true }

export default function AdminPostsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const load = () => getAdminPosts().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }) }
  const openEdit = p => { setForm(p); setModal({ mode: 'edit', data: p }) }
  const save = async e => {
    e.preventDefault()
    try { modal.mode === 'create' ? await createPost(form) : await updatePost(modal.data.id, form); toast.success('Đã lưu tin tức'); setModal(null); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Không thể lưu') }
  }
  const remove = async id => { if (!confirm('Xóa tin tức này?')) return; try { await deletePost(id); toast.success('Đã xóa'); load() } catch (err) { toast.error(err.response?.data?.message || 'Không thể xóa') } }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý tin tức</h1><button className="btn btn-primary" onClick={openCreate}><i className="fa-solid fa-plus" /> Thêm tin</button></div>
      {loading ? <div className="spinner" /> : <div className="card"><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>{['Tiêu đề', 'Slug', 'Tóm tắt', 'Trạng thái', 'Thao tác'].map(h => <th key={h} style={{ padding: 12, textAlign: 'left' }}>{h}</th>)}</tr></thead>
        <tbody>{items.map(p => <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 12, fontWeight: 600 }}>{p.title}</td><td style={{ padding: 12 }}>{p.slug}</td><td style={{ padding: 12, maxWidth: 320 }}>{p.summary}</td><td style={{ padding: 12 }}><span className={`badge ${p.published ? 'badge-success' : 'badge-secondary'}`}>{p.published ? 'Hiển thị' : 'Ẩn'}</span></td><td style={{ padding: 12 }}><button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}><i className="fa-solid fa-pen" /></button> <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}><i className="fa-solid fa-trash" /></button></td></tr>)}</tbody>
      </table></div></div>}
      {modal && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
        <div className="card" style={{ width: '100%', maxWidth: 720 }}><div className="card-body">
          <h2 style={{ fontWeight: 700, marginBottom: 16 }}>{modal.mode === 'create' ? 'Thêm tin tức' : 'Sửa tin tức'}</h2>
          <form onSubmit={save}>
            <div className="form-group"><label className="form-label">Tiêu đề</label><input className="form-control" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Slug</label><input className="form-control" value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Tóm tắt</label><textarea className="form-control" rows={2} value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Nội dung</label><textarea className="form-control" rows={8} value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Ảnh thumbnail URL</label><input className="form-control" value={form.thumbnail || ''} onChange={e => setForm({ ...form, thumbnail: e.target.value })} /></div>
            <label style={{ display: 'flex', gap: 8, marginBottom: 16 }}><input type="checkbox" checked={!!form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Hiển thị</label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary">Lưu</button></div>
          </form>
        </div></div>
      </div>}
    </div>
  )
}

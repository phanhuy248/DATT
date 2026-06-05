import React, { useEffect, useState } from 'react'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api/suppliers'
import { toast } from 'react-toastify'

const EMPTY = { name: '', representativeName: '', email: '', phone: '', address: '', active: true }

export default function SuppliersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const load = () => getSuppliers().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }) }
  const openEdit = s => { setForm(s); setModal({ mode: 'edit', data: s }) }

  const save = async e => {
    e.preventDefault()
    try {
      modal.mode === 'create' ? await createSupplier(form) : await updateSupplier(modal.data.id, form)
      toast.success('Đã lưu nhà cung cấp'); setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Không thể lưu') }
  }

  const remove = async id => {
    if (!confirm('Xóa nhà cung cấp này?')) return
    try { await deleteSupplier(id); toast.success('Đã xóa'); load() } catch (err) { toast.error(err.response?.data?.message || 'Không thể xóa') }
  }

  const field = (key, label) => <div className="form-group"><label className="form-label">{label}</label><input className="form-control" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý nhà cung cấp</h1>
        <button className="btn btn-primary" onClick={openCreate}><i className="fa-solid fa-plus" /> Thêm nhà cung cấp</button>
      </div>
      {loading ? <div className="spinner" /> : (
        <div className="card"><div className="admin-table-wrap" style={{ overflowX: 'auto' }}><table className="admin-table-card" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>{['Tên', 'Đại diện', 'Email', 'SĐT', 'Trạng thái', 'Thao tác'].map(h => <th key={h} style={{ padding: 12, textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>{items.map(s => <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td data-label="Tên" style={{ padding: 12, fontWeight: 600 }}>{s.name}</td><td data-label="Đại diện" style={{ padding: 12 }}>{s.representativeName || '-'}</td><td data-label="Email" style={{ padding: 12 }}>{s.email || '-'}</td><td data-label="SĐT" style={{ padding: 12 }}>{s.phone || '-'}</td>
            <td data-label="Trạng thái" style={{ padding: 12 }}><span className={`badge ${s.active ? 'badge-success' : 'badge-secondary'}`}>{s.active ? 'Hoạt động' : 'Tắt'}</span></td>
            <td data-label="Thao tác" style={{ padding: 12 }}><button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}><i className="fa-solid fa-pen" /></button> <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}><i className="fa-solid fa-trash" /></button></td>
          </tr>)}</tbody>
        </table></div></div>
      )}
      {modal && <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="card" style={{ width: '100%', maxWidth: 520 }}><div className="card-body">
          <h2 style={{ fontWeight: 700, marginBottom: 16 }}>{modal.mode === 'create' ? 'Thêm nhà cung cấp' : 'Sửa nhà cung cấp'}</h2>
          <form onSubmit={save}>{field('name', 'Tên nhà cung cấp')}{field('representativeName', 'Người đại diện')}{field('email', 'Email')}{field('phone', 'Số điện thoại')}{field('address', 'Địa chỉ')}
            <label style={{ display: 'flex', gap: 8, marginBottom: 16 }}><input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Hoạt động</label>
            <div className="admin-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary">Lưu</button></div>
          </form>
        </div></div>
      </div>}
    </div>
  )
}

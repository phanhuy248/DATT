import React, { useEffect, useState } from 'react'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../api/coupons'
import { toast } from 'react-toastify'

const EMPTY = { code: '', description: '', discountType: 'FIXED', discountValue: '', minOrderAmount: 0, usageLimit: 0, active: true }

export default function CouponsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const load = () => getCoupons().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }) }
  const openEdit = (c) => { setForm({ ...c }); setModal({ mode: 'edit', data: c }) }

  const save = async (e) => {
    e.preventDefault()
    const data = { ...form, discountValue: Number(form.discountValue), minOrderAmount: Number(form.minOrderAmount || 0), usageLimit: Number(form.usageLimit || 0) }
    try {
      modal.mode === 'create' ? await createCoupon(data) : await updateCoupon(modal.data.id, data)
      toast.success('Đã lưu mã giảm giá')
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Không thể lưu') }
  }

  const remove = async (id) => {
    if (!confirm('Xóa mã giảm giá này?')) return
    try { await deleteCoupon(id); toast.success('Đã xóa'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Không thể xóa') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý khuyến mãi</h1>
        <button className="btn btn-primary" onClick={openCreate}><i className="fa-solid fa-plus" /> Thêm mã</button>
      </div>
      {loading ? <div className="spinner" /> : (
        <div className="card"><div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Mã', 'Loại', 'Giá trị', 'Đơn tối thiểu', 'Đã dùng', 'Trạng thái', 'Thao tác'].map(h => <th key={h} style={{ padding: 12, textAlign: 'left' }}>{h}</th>)}
            </tr></thead>
            <tbody>{items.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 700 }}>{c.code}</td>
                <td style={{ padding: 12 }}>{c.discountType}</td>
                <td style={{ padding: 12 }}>{c.discountType === 'PERCENT' ? `${c.discountValue}%` : `${Number(c.discountValue).toLocaleString('vi-VN')}₫`}</td>
                <td style={{ padding: 12 }}>{Number(c.minOrderAmount || 0).toLocaleString('vi-VN')}₫</td>
                <td style={{ padding: 12 }}>{c.usedCount}/{c.usageLimit || '∞'}</td>
                <td style={{ padding: 12 }}><span className={`badge ${c.active ? 'badge-success' : 'badge-secondary'}`}>{c.active ? 'Bật' : 'Tắt'}</span></td>
                <td style={{ padding: 12 }}><button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}><i className="fa-solid fa-pen" /></button> <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}><i className="fa-solid fa-trash" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div></div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 520 }}><div className="card-body">
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>{modal.mode === 'create' ? 'Thêm mã giảm giá' : 'Sửa mã giảm giá'}</h2>
            <form onSubmit={save}>
              <div className="form-group"><label className="form-label">Mã</label><input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Mô tả</label><input className="form-control" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Loại</label><select className="form-control" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}><option value="FIXED">Giảm tiền</option><option value="PERCENT">Phần trăm</option></select></div>
                <div className="form-group"><label className="form-label">Giá trị</label><input type="number" className="form-control" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Đơn tối thiểu</label><input type="number" className="form-control" value={form.minOrderAmount || 0} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Lượt dùng</label><input type="number" className="form-control" value={form.usageLimit || 0} onChange={e => setForm({ ...form, usageLimit: e.target.value })} /></div>
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}><input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Đang bật</label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary">Lưu</button></div>
            </form>
          </div></div>
        </div>
      )}
    </div>
  )
}

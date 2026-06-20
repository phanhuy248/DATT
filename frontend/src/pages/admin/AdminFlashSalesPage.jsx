import React, { useEffect, useState } from 'react'
import { getAdminFlashSales, createFlashSale, updateFlashSale, deleteFlashSale } from '../../api/flashSales'
import { getProducts } from '../../api/products'
import { toast } from 'react-toastify'

const fmt = (v) => Number(v || 0).toLocaleString('vi-VN')
const toInputDt = (iso) => (iso ? iso.substring(0, 16) : '')
const fromInputDt = (s) => (s ? s + ':00' : null)

const EMPTY = {
  productId: '', productName: '', salePrice: '', startAt: '', endAt: '',
  quantityLimit: '', active: true, sortOrder: 0,
}

export default function AdminFlashSalesPage() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null)   // null | { mode: 'create'|'edit', data? }
  const [form, setForm]     = useState(EMPTY)

  // Product search state
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [searching, setSearching] = useState(false)

  const load = () =>
    getAdminFlashSales({ page: 0, size: 100 })
      .then(d => setItems(d.content || []))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm(EMPTY); setProductSearch(''); setProductResults([])
    setModal({ mode: 'create' })
  }

  const openEdit = (item) => {
    setForm({
      productId: item.productId,
      productName: item.productName,
      salePrice: item.salePrice,
      startAt: toInputDt(item.startAt),
      endAt: toInputDt(item.endAt),
      quantityLimit: item.quantityLimit ?? '',
      active: item.active,
      sortOrder: item.sortOrder,
    })
    setProductSearch(item.productName)
    setProductResults([])
    setModal({ mode: 'edit', data: item })
  }

  const searchProducts = async () => {
    if (!productSearch.trim()) return
    setSearching(true)
    try {
      const res = await getProducts({ keyword: productSearch.trim(), page: 0, size: 10 })
      setProductResults(res.content || [])
    } catch { toast.error('Không thể tìm sản phẩm') }
    finally { setSearching(false) }
  }

  const selectProduct = (p) => {
    setForm(f => ({ ...f, productId: p.id, productName: p.name }))
    setProductSearch(p.name)
    setProductResults([])
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.productId) { toast.error('Vui lòng chọn sản phẩm'); return }
    const payload = {
      productId: Number(form.productId),
      salePrice: Number(form.salePrice),
      startAt: fromInputDt(form.startAt),
      endAt: fromInputDt(form.endAt),
      quantityLimit: form.quantityLimit !== '' ? Number(form.quantityLimit) : null,
      active: form.active,
      sortOrder: Number(form.sortOrder || 0),
    }
    try {
      if (modal.mode === 'create') {
        await createFlashSale(payload)
        toast.success('Đã thêm vào Flash Sale')
      } else {
        const { productId, ...updatePayload } = payload
        await updateFlashSale(modal.data.id, updatePayload)
        toast.success('Đã cập nhật Flash Sale')
      }
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Không thể lưu') }
  }

  const remove = async (id) => {
    if (!confirm('Xóa sản phẩm này khỏi Flash Sale?')) return
    try { await deleteFlashSale(id); toast.success('Đã xóa'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Không thể xóa') }
  }

  const fmtDt = (iso) => iso ? new Date(iso).toLocaleString('vi-VN') : '—'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý Flash Sale</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="fa-solid fa-plus" /> Thêm sản phẩm
        </button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="card"><div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Sản phẩm', 'Giá gốc', 'Giá sale', 'Giảm', 'Thời gian', 'Đã bán / Giới hạn', 'Trạng thái', 'Thứ tự', ''].map(h =>
                <th key={h} style={{ padding: 10, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}
            </tr></thead>
            <tbody>{items.map(it => {
              const isInvalid = Number(it.salePrice) >= Number(it.originalPrice)
              return (
              <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9', background: isInvalid ? '#fff7ed' : '' }}>
                <td style={{ padding: 10, fontWeight: 600 }}>
                  {it.productName}
                  {isInvalid && (
                    <span style={{ marginLeft: 8, fontSize: 11, background: '#f97316', color: '#fff', padding: '1px 6px', borderRadius: 8 }}>
                      ⚠ Ẩn khỏi website
                    </span>
                  )}
                </td>
                <td style={{ padding: 10 }}><s>{fmt(it.originalPrice)}₫</s></td>
                <td style={{ padding: 10, color: isInvalid ? '#f97316' : '#c70039', fontWeight: 700 }}>{fmt(it.salePrice)}₫</td>
                <td style={{ padding: 10 }}>
                  {isInvalid ? (
                    <span style={{ background: '#f97316', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                      Giá lỗi
                    </span>
                  ) : (
                    <span style={{ background: '#c70039', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                      -{it.discountPercent}%
                    </span>
                  )}
                </td>
                <td style={{ padding: 10, fontSize: 12 }}>
                  {fmtDt(it.startAt)}<br /><span style={{ color: '#888' }}>→ {fmtDt(it.endAt)}</span>
                </td>
                <td style={{ padding: 10 }}>{it.soldCount} / {it.quantityLimit ?? '∞'}</td>
                <td style={{ padding: 10 }}>
                  <span className={`badge ${it.active ? 'badge-success' : 'badge-secondary'}`}>
                    {it.active ? 'Bật' : 'Tắt'}
                  </span>
                </td>
                <td style={{ padding: 10 }}>{it.sortOrder}</td>
                <td style={{ padding: 10, whiteSpace: 'nowrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(it)} style={{ marginRight: 4 }}>
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(it.id)}>
                    <i className="fa-solid fa-trash" />
                  </button>
                </td>
              </tr>
              )
            })}</tbody>
          </table>
          {items.length === 0 && (
            <p style={{ textAlign: 'center', padding: 24, color: '#888' }}>Chưa có sản phẩm nào trong Flash Sale</p>
          )}
        </div></div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-body">
              <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
                {modal.mode === 'create' ? 'Thêm sản phẩm Flash Sale' : 'Sửa Flash Sale'}
              </h2>
              <form onSubmit={save}>
                {/* Product search — chỉ hiển thị khi tạo mới */}
                {modal.mode === 'create' && (
                  <div className="form-group">
                    <label className="form-label">Sản phẩm</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="form-control"
                        placeholder="Nhập tên sản phẩm..."
                        value={productSearch}
                        onChange={e => { setProductSearch(e.target.value); setForm(f => ({ ...f, productId: '', productName: '' })) }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchProducts())}
                      />
                      <button type="button" className="btn btn-secondary" onClick={searchProducts} disabled={searching}>
                        {searching ? '...' : 'Tìm'}
                      </button>
                    </div>
                    {productResults.length > 0 && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, marginTop: 4, maxHeight: 180, overflowY: 'auto' }}>
                        {productResults.map(p => (
                          <div key={p.id}
                            onClick={() => selectProduct(p)}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: form.productId === p.id ? '#fff0f3' : '#fff' }}
                          >
                            <strong>{p.name}</strong>
                            <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>{fmt(p.price)}₫</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {form.productId && (
                      <p style={{ marginTop: 4, fontSize: 12, color: '#16a34a' }}>✓ Đã chọn: {form.productName}</p>
                    )}
                  </div>
                )}
                {modal.mode === 'edit' && (
                  <div className="form-group">
                    <label className="form-label">Sản phẩm</label>
                    <input className="form-control" value={form.productName} disabled />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Giá sale (VNĐ) *</label>
                    <input type="number" min="1" required className="form-control"
                      value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giới hạn SL (để trống = ∞)</label>
                    <input type="number" min="1" className="form-control"
                      value={form.quantityLimit} onChange={e => setForm(f => ({ ...f, quantityLimit: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bắt đầu *</label>
                    <input type="datetime-local" required className="form-control"
                      value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kết thúc *</label>
                    <input type="datetime-local" required className="form-control"
                      value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thứ tự hiển thị</label>
                    <input type="number" className="form-control"
                      value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
                  </div>
                </div>

                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                  <input type="checkbox" checked={!!form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                  Đang bật
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button>
                  <button className="btn btn-primary">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

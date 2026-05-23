import React, { useEffect, useRef, useState, useCallback } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct, importStock, importProductsJson } from '../../api/products'
import { getCategories } from '../../api/categories'
import { getSuppliers } from '../../api/suppliers'
import { toast } from 'react-toastify'
import { getImageUrl } from '../../utils/image'

const EMPTY_FORM = { name: '', price: '', shortDesc: '', detailDesc: '', quantity: '', factory: '', target: '', categoryId: '', supplierId: '' }

export default function AdminProductsPage() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const importInputRef = useRef(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, size: 10, sortBy: 'newest' }
    if (search) params.keyword = search
    getProducts(params).then(setData).finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { getCategories().then(setCategories) }, [])
  useEffect(() => { getSuppliers().then(setSuppliers).catch(() => setSuppliers([])) }, [])

  const openCreate = () => { setForm(EMPTY_FORM); setImageFile(null); setImagePreview(null); setModal({ mode: 'create' }) }
  const openEdit = (p) => {
    setForm({ name: p.name, price: p.price, shortDesc: p.shortDesc, detailDesc: p.detailDesc, quantity: p.quantity, factory: p.factory || '', target: p.target || '', categoryId: p.categoryId || '', supplierId: p.supplierId || '' })
    setImageFile(null)
    setImagePreview(getImageUrl(p.image))
    setModal({ mode: 'edit', data: p })
  }

  const handleImageChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.quantity) { toast.error('Vui lòng điền đầy đủ thông tin bắt buộc'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      const data = JSON.stringify({ ...form, price: parseFloat(form.price), quantity: parseInt(form.quantity) })
      fd.append('data', new Blob([data], { type: 'application/json' }))
      if (imageFile) fd.append('image', imageFile)

      if (modal.mode === 'create') { await createProduct(fd); toast.success('Tạo sản phẩm thành công!') }
      else { await updateProduct(modal.data.id, fd); toast.success('Cập nhật thành công!') }
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Thao tác thất bại') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return
    try { await deleteProduct(id); toast.success('Đã xóa sản phẩm'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Không thể xóa') }
  }

  const handleImportStock = async (product) => {
    const value = prompt(`Nhập thêm số lượng cho "${product.name}"`)
    const quantity = Number(value)
    if (!quantity || quantity <= 0) return
    try {
      await importStock(product.id, { quantity, note: 'Nhập hàng từ trang quản trị' })
      toast.success('Nhập hàng thành công')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Không thể nhập hàng') }
  }

  const handleImportJson = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      const payload = JSON.parse(await file.text())
      const result = await importProductsJson(payload)
      toast.success(`Import xong: tạo ${result.created}, cập nhật ${result.updated}, bỏ qua ${result.skipped}`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể import JSON')
    } finally {
      setImporting(false)
    }
  }

  const f = (key, label, type = 'text', required = false) => (
    <div className="form-group">
      <label className="form-label">{label}{required && ' *'}</label>
      {type === 'textarea'
        ? <textarea className="form-control" rows={3} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
        : <input type={type} className="form-control" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý sản phẩm</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="form-control" style={{ width: 200 }} placeholder="Tìm kiếm..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <input ref={importInputRef} type="file" accept="application/json,.json" onChange={handleImportJson} style={{ display: 'none' }} />
          <button className="btn btn-secondary" disabled={importing} onClick={() => importInputRef.current?.click()}>
            <i className={`fa-solid ${importing ? 'fa-spinner fa-spin' : 'fa-file-import'}`} /> Import JSON
          </button>
          <button className="btn btn-primary" onClick={openCreate}><i className="fa-solid fa-plus" /> Thêm sản phẩm</button>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    {['Ảnh', 'Tên sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Đã bán', 'Thao tác'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.content.length === 0
                    ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Không có sản phẩm</td></tr>
                    : data.content.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ width: 48, height: 48, background: '#f8fafc', borderRadius: 6, overflow: 'hidden' }}>
                            {p.image
                              ? <img src={getImageUrl(p.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="fa-solid fa-image" style={{ color: '#cbd5e1' }} /></div>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <p style={{ fontWeight: 600, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                          <p style={{ fontSize: 12, color: '#9ca3af' }}>{p.factory}</p>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {p.categoryName ? <span className="badge badge-info">{p.categoryName}</span> : <span style={{ color: '#9ca3af' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>{p.price?.toLocaleString('vi-VN')}₫</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ color: p.quantity <= 5 ? '#dc2626' : '#16a34a', fontWeight: 500 }}>{p.quantity}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#6b7280' }}>{p.sold}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}><i className="fa-solid fa-pen" /></button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleImportStock(p)}><i className="fa-solid fa-boxes-stacked" /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.name)}><i className="fa-solid fa-trash" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          {data.totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><i className="fa-solid fa-angle-left" /></button>
              {Array.from({ length: data.totalPages }, (_, i) => <button key={i} className={`page-btn ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>)}
              <button className="page-btn" disabled={page >= data.totalPages - 1} onClick={() => setPage(p => p + 1)}><i className="fa-solid fa-angle-right" /></button>
            </div>
          )}
        </>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' }}>
          <div className="card" style={{ width: '100%', maxWidth: 640, margin: 'auto' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>{modal.mode === 'create' ? 'Thêm sản phẩm' : 'Chỉnh sửa sản phẩm'}</h2>
                <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
              </div>
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  {f('name', 'Tên sản phẩm', 'text', true)}
                  {f('price', 'Giá (₫)', 'number', true)}
                  {f('quantity', 'Số lượng', 'number', true)}
                  <div className="form-group">
                    <label className="form-label">Danh mục</label>
                    <select className="form-control" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nhà cung cấp</label>
                    <select className="form-control" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                      <option value="">-- Chọn nhà cung cấp --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  {f('factory', 'Thương hiệu')}
                  {f('target', 'Đối tượng')}
                </div>
                {f('shortDesc', 'Mô tả ngắn', 'textarea', true)}
                {f('detailDesc', 'Mô tả chi tiết', 'textarea', true)}

                <div className="form-group">
                  <label className="form-label">Ảnh sản phẩm</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {imagePreview && (
                      <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                      <i className="fa-solid fa-upload" /> Chọn ảnh
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Đang lưu...</> : 'Lưu sản phẩm'}
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

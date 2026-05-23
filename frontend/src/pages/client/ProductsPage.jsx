import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProducts } from '../../api/products'
import { getCategories } from '../../api/categories'
import ProductCard from '../../components/product/ProductCard'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
]

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  const keyword = searchParams.get('keyword') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const sortBy = searchParams.get('sortBy') || 'newest'
  const page = parseInt(searchParams.get('page') || '0')

  const [filterInput, setFilterInput] = useState({ keyword, minPrice, maxPrice })

  useEffect(() => { getCategories().then(setCategories) }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { sortBy, page, size: 12 }
      if (keyword) params.keyword = keyword
      if (categoryId) params.categoryId = categoryId
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      const result = await getProducts(params)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [keyword, categoryId, minPrice, maxPrice, sortBy, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const setParam = (key, value) => {
    const p = Object.fromEntries(searchParams)
    if (value !== undefined && value !== null && value !== '') p[key] = String(value); else delete p[key]
    if (key !== 'page') p.page = '0'
    setSearchParams(p)
  }

  const applyFilter = (e) => {
    e.preventDefault()
    const p = Object.fromEntries(searchParams)
    if (filterInput.keyword) p.keyword = filterInput.keyword; else delete p.keyword
    if (filterInput.minPrice) p.minPrice = filterInput.minPrice; else delete p.minPrice
    if (filterInput.maxPrice) p.maxPrice = filterInput.maxPrice; else delete p.maxPrice
    p.page = '0'
    setSearchParams(p)
  }

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Sidebar Filters */}
        <aside>
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Bộ lọc</h3>
              <form onSubmit={applyFilter}>
                <div className="form-group">
                  <label className="form-label">Tìm kiếm</label>
                  <input className="form-control" placeholder="Tên sản phẩm..."
                    value={filterInput.keyword}
                    onChange={e => setFilterInput({ ...filterInput, keyword: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select className="form-control" value={categoryId}
                    onChange={e => setParam('categoryId', e.target.value)}>
                    <option value="">Tất cả danh mục</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Giá từ (₫)</label>
                  <input className="form-control" type="number" placeholder="0"
                    value={filterInput.minPrice}
                    onChange={e => setFilterInput({ ...filterInput, minPrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá đến (₫)</label>
                  <input className="form-control" type="number" placeholder="100,000,000"
                    value={filterInput.maxPrice}
                    onChange={e => setFilterInput({ ...filterInput, maxPrice: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary btn-full">Áp dụng</button>
                <button type="button" className="btn btn-secondary btn-full mt-2"
                  onClick={() => { setFilterInput({ keyword: '', minPrice: '', maxPrice: '' }); setSearchParams({}) }}>
                  Xóa bộ lọc
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p className="text-muted text-sm">{data.totalElements} sản phẩm</p>
            <select className="form-control" style={{ width: 160 }} value={sortBy}
              onChange={e => setParam('sortBy', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? <div className="spinner" /> :
            data.content.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-box-open" />
                <p>Không tìm thấy sản phẩm nào</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {data.content.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )
          }

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 0} onClick={() => setParam('page', page - 1)}>
                <i className="fa-solid fa-angle-left" />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button key={i} className={`page-btn ${i === page ? 'active' : ''}`}
                  onClick={() => setParam('page', i)}>{i + 1}</button>
              ))}
              <button className="page-btn" disabled={page >= data.totalPages - 1} onClick={() => setParam('page', page + 1)}>
                <i className="fa-solid fa-angle-right" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

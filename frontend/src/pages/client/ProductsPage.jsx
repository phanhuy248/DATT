import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { getCategories } from '../../api/categories'
import { getProducts } from '../../api/products'
import ProductCard from '../../components/product/ProductCard'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
]

const BRAND_OPTIONS = ['Apple', 'Samsung', 'ASUS', 'Sony', 'Lenovo', 'HP', 'Dell', 'Acer', 'MSI', 'Realme', 'Vivo', 'Xiaomi', 'Oppo', 'Huawei']


export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  const keyword = searchParams.get('keyword') || ''
  const categoryIdParam = searchParams.get('categoryId') || ''
  const categoryName = searchParams.get('categoryName') || searchParams.get('category') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const brand = searchParams.get('brand') || ''
  const sortBy = searchParams.get('sortBy') || 'newest'
  const page = parseInt(searchParams.get('page') || '0', 10)
  const aiTags = (searchParams.get('aiTags') || '').split('|').filter(Boolean)
  const selectedCategoryId =
    categoryIdParam ||
    (categoryName
      ? categories.find((category) => category.name.toLowerCase() === categoryName.toLowerCase())?.id?.toString() || ''
      : '')

  const [filterInput, setFilterInput] = useState({ keyword, minPrice, maxPrice })

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setFilterInput({ keyword, minPrice, maxPrice })
  }, [keyword, minPrice, maxPrice])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { sortBy, page, size: 12 }
      if (keyword) params.keyword = keyword
      if (selectedCategoryId) params.categoryId = selectedCategoryId
      else if (categoryName) params.categoryName = categoryName
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (brand) params.brand = brand
      const result = await getProducts(params)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [keyword, selectedCategoryId, categoryName, minPrice, maxPrice, brand, sortBy, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const setParam = (key, value) => {
    const next = Object.fromEntries(searchParams)
    if (value !== undefined && value !== null && value !== '') next[key] = String(value)
    else delete next[key]
    if (key === 'categoryId') {
      delete next.category
      delete next.categoryName
    }
    delete next.ram
    if (key !== 'page') next.page = '0'
    setSearchParams(next)
  }

  const applyFilter = (event) => {
    event.preventDefault()
    const next = Object.fromEntries(searchParams)
    if (filterInput.keyword) next.keyword = filterInput.keyword
    else delete next.keyword
    if (filterInput.minPrice) next.minPrice = filterInput.minPrice
    else delete next.minPrice
    if (filterInput.maxPrice) next.maxPrice = filterInput.maxPrice
    else delete next.maxPrice
    delete next.ram
    next.page = '0'
    setSearchParams(next)
  }

  const resetFilters = () => {
    setFilterInput({ keyword: '', minPrice: '', maxPrice: '' })
    setSearchParams({})
  }

  return (
    <div className="bg-shop-bg">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 lg:px-6">
        <SectionHeader title="Tất cả sản phẩm" subtitle="Tìm kiếm và lọc sản phẩm công nghệ chính hãng tại SMARTSHOP" />

        <div className="products-layout grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-shop-red" />
              <h3 className="text-base font-bold text-shop-text">Bộ lọc</h3>
            </div>

            <form onSubmit={applyFilter} className="space-y-4">
              <Field label="Tìm kiếm">
                <input
                  className="form-control"
                  placeholder="Tên sản phẩm..."
                  value={filterInput.keyword}
                  onChange={(event) => setFilterInput({ ...filterInput, keyword: event.target.value })}
                />
              </Field>

              <Field label="Danh mục">
                <select className="form-control" value={selectedCategoryId} onChange={(event) => setParam('categoryId', event.target.value)}>
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Thương hiệu">
                <select
                  className="form-control"
                  value={brand}
                  onChange={(event) => setParam('brand', event.target.value)}
                >
                  <option value="">Tất cả thương hiệu</option>
                  {BRAND_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Giá từ">
                <input
                  className="form-control"
                  type="number"
                  placeholder="0"
                  value={filterInput.minPrice}
                  onChange={(event) => setFilterInput({ ...filterInput, minPrice: event.target.value })}
                />
              </Field>

              <Field label="Giá đến">
                <input
                  className="form-control"
                  type="number"
                  placeholder="100000000"
                  value={filterInput.maxPrice}
                  onChange={(event) => setFilterInput({ ...filterInput, maxPrice: event.target.value })}
                />
              </Field>

              <Button type="submit" className="w-full">
                Áp dụng
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={resetFilters}>
                Xóa bộ lọc
              </Button>
            </form>
          </aside>

          <section className="min-w-0">
            <div className="product-list-toolbar mb-5 flex items-center justify-between gap-4 rounded-2xl border border-shop-border bg-shop-surface px-5 py-4 shadow-sm">
              <div className="min-w-0">
                <p className="text-sm font-bold text-shop-muted">{data.totalElements || 0} sản phẩm</p>
                {aiTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-shop-softBlue px-3 py-1 text-xs font-bold text-shop-red">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <select className="form-control max-w-[180px]" value={sortBy} onChange={(event) => setParam('sortBy', event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : data.content.length === 0 ? (
              <div className="empty-state rounded-2xl border border-shop-border bg-shop-surface shadow-sm">
                <p>Không tìm thấy sản phẩm phù hợp</p>
              </div>
            ) : (
              <div className="responsive-product-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {data.content.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {data.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button variant="icon" disabled={page === 0} onClick={() => setParam('page', page - 1)} aria-label="Trang trước">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: data.totalPages }, (_, index) => (
                  <Button
                    key={index}
                    variant={index === page ? 'primary' : 'secondary'}
                    className="h-10 w-10 px-0"
                    onClick={() => setParam('page', index)}
                  >
                    {index + 1}
                  </Button>
                ))}
                <Button variant="icon" disabled={page >= data.totalPages - 1} onClick={() => setParam('page', page + 1)} aria-label="Trang sau">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-shop-text">{label}</span>
      {children}
    </label>
  )
}

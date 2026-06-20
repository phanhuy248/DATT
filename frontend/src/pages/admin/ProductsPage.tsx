import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { createProduct, deleteProduct, getProducts, restoreProduct, toggleProductActive, updateProduct } from '../../api/products'
import { getCategories } from '../../api/categories'
import { getSuppliers } from '../../api/suppliers'
import ProductFilters, { type ProductFiltersValue } from '../../components/admin/ProductFilters'
import ProductFormModal, { type ProductFormValue } from '../../components/admin/ProductFormModal'
import ProductsTable from '../../components/admin/ProductsTable'
import { StatsCardsView } from '../../components/admin/StatsCards'
import type { AdminProduct, ProductStatus } from '../../mock/products'
import { products as fallbackProducts } from '../../mock/products'
import { getImageUrl } from '../../utils/image'
import { Button, ConfirmDialog, PageHeader } from '../../components/admin/ui'

type Option = {
  id: string | number
  name: string
}

type ModalState =
  | { mode: 'view' | 'edit'; product: AdminProduct }
  | { mode: 'create'; product?: null }
  | null

const emptyFilters: ProductFiltersValue = {
  keyword: '',
  categoryId: '',
  status: '',
  minPrice: '',
  maxPrice: '',
}

function deriveStatus(stock: number, active: boolean): ProductStatus {
  if (!active) return 'Tạm dừng'
  if (stock <= 0) return 'Hết hàng'
  if (stock <= 10) return 'Sắp hết hàng'
  return 'Còn hàng'
}

function formatCurrency(value: unknown) {
  const numericValue = Number(value || 0)
  return `${numericValue.toLocaleString('vi-VN')}đ`
}

function createSku(product: any) {
  const explicitSku = product?.sku || product?.specifications?.SKU || product?.specifications?.sku
  if (explicitSku) return explicitSku
  return `SP-${String(product?.id || 'NEW').padStart(5, '0')}`
}

function mapApiProduct(product: any): AdminProduct {
  const stock  = Number(product.quantity ?? product.stock ?? 0)
  const sold   = Number(product.sold ?? 0)
  const active = product.active !== false
  const capacity = Math.max(Number(product.capacity || 0), stock + sold, stock, 30)

  return {
    id: product.id,
    name: product.name || 'Sản phẩm chưa đặt tên',
    sku: createSku(product),
    category: product.categoryName || product.category || 'Khác',
    price: formatCurrency(product.price),
    stock,
    capacity,
    sold,
    active,
    status: deriveStatus(stock, active),
    image: product.image ? getImageUrl(product.image) : '',
    raw: product,
  }
}

function buildFormData(value: ProductFormValue, imageFile?: File | null) {
  const payload = {
    name: value.name.trim(),
    price: Number(value.price),
    quantity: Number(value.quantity),
    shortDesc: value.shortDesc.trim() || value.name.trim(),
    detailDesc: value.detailDesc.trim() || value.shortDesc.trim() || value.name.trim(),
    factory: value.factory.trim(),
    target: value.target.trim(),
    categoryId: value.categoryId ? Number(value.categoryId) : null,
    supplierId: value.supplierId ? Number(value.supplierId) : null,
  }

  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (imageFile) formData.append('image', imageFile)
  return formData
}

export default function ProductsPage() {
  const location = useLocation()
  const navHandled = useRef(false)

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [allProductsForStats, setAllProductsForStats] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [suppliers, setSuppliers] = useState<Option[]>([])
  const [filters, setFilters] = useState<ProductFiltersValue>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<ProductFiltersValue>(emptyFilters)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null)
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      // "Hết hàng" / "Sắp hết hàng" are derived from quantity — backend has no quantity filter,
      // so we must fetch all products then filter client-side.
      const needsFullFetch = appliedFilters.status === 'Hết hàng' || appliedFilters.status === 'Sắp hết hàng'
      const params: Record<string, any> = needsFullFetch
        ? { page: 0, size: 9999, sortBy: 'newest' }
        : { page, size: pageSize, sortBy: 'newest' }
      if (appliedFilters.keyword) params.keyword = appliedFilters.keyword
      if (appliedFilters.categoryId) params.categoryId = appliedFilters.categoryId
      if (appliedFilters.minPrice) params.minPrice = appliedFilters.minPrice
      if (appliedFilters.maxPrice) params.maxPrice = appliedFilters.maxPrice

      const response = await getProducts(params)
      const mapped = (response.content || []).map(mapApiProduct)
      const filtered = appliedFilters.status ? mapped.filter((product) => product.status === appliedFilters.status) : mapped
      setProducts(filtered)
      setTotalItems(appliedFilters.status ? filtered.length : Number(response.totalElements || filtered.length))
      setTotalPages(Math.max(1, appliedFilters.status ? Math.ceil(filtered.length / pageSize) : Number(response.totalPages || 1)))
    } catch (error) {
      const filtered = appliedFilters.status ? fallbackProducts.filter((product) => product.status === appliedFilters.status) : fallbackProducts
      setProducts(filtered)
      setTotalItems(filtered.length)
      setTotalPages(1)
      toast.warn('Đang dùng dữ liệu mẫu vì chưa tải được API sản phẩm.')
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page, pageSize])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const loadStats = useCallback(async () => {
    try {
      const response = await getProducts({ page: 0, size: 9999, sortBy: 'newest' })
      setAllProductsForStats((response.content || []).map(mapApiProduct))
    } catch {
      setAllProductsForStats(fallbackProducts)
    }
  }, [])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]))
    getSuppliers().then(setSuppliers).catch(() => setSuppliers([]))
    loadStats()
  }, [loadStats])

  // Handle navigation state from dashboard
  useEffect(() => {
    if (navHandled.current) return
    const state = location.state as { openProductId?: number; applyStatus?: string } | null
    if (!state) return

    if (state.applyStatus) {
      navHandled.current = true
      const next = { ...emptyFilters, status: state.applyStatus }
      setFilters(next)
      setAppliedFilters(next)
      setPage(0)
    } else if (state.openProductId && !loading && products.length > 0) {
      const found = products.find((p) => p.id === state.openProductId)
      if (found) {
        navHandled.current = true
        setModal({ mode: 'view', product: found })
      }
    }
  }, [location.state, loading, products])

  const stats = useMemo(() => {
    const all = allProductsForStats
    const total = all.length
    const paused = all.filter((p) => p.status === 'Tạm dừng').length
    const out = all.filter((p) => p.status === 'Hết hàng').length
    const low = all.filter((p) => p.status === 'Sắp hết hàng').length
    const inStock = all.filter((p) => p.status === 'Còn hàng').length
    return [
      { id: 'total',   label: 'Tổng sản phẩm',   value: total.toLocaleString('vi-VN'),   tone: 'rose'  as const },
      { id: 'inStock', label: 'Còn hàng',          value: inStock.toLocaleString('vi-VN'), tone: 'teal'  as const },
      { id: 'low',     label: 'Sắp hết hàng',      value: low.toLocaleString('vi-VN'),    tone: 'amber' as const },
      { id: 'out',     label: 'Đã hết hàng',       value: out.toLocaleString('vi-VN'),    tone: 'red'   as const },
      { id: 'paused',  label: 'Tạm dừng',          value: paused.toLocaleString('vi-VN'), tone: 'slate' as const },
    ]
  }, [allProductsForStats])

  const handleApplyFilters = () => {
    setPage(0)
    setAppliedFilters(filters)
  }

  const handleResetFilters = () => {
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setPage(0)
  }

  const handleSave = async (value: ProductFormValue, imageFile: File | null) => {
    if (!value.name.trim() || !value.price || !value.quantity) {
      toast.error('Vui lòng nhập tên, giá và tồn kho.')
      return
    }

    setSaving(true)
    try {
      const formData = buildFormData(value, imageFile)
      if (modal?.mode === 'edit') {
        await updateProduct(modal.product.raw.id, formData)
        toast.success('Đã cập nhật sản phẩm.')
      } else {
        await createProduct(formData)
        toast.success('Đã thêm sản phẩm.')
      }
      setModal(null)
      await Promise.all([loadProducts(), loadStats()])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu sản phẩm.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (product: AdminProduct) => {
    try {
      await toggleProductActive(product.raw.id)
      const next = !product.active
      toast.success(next ? `Đã kích hoạt "${product.name}"` : `Đã tạm dừng "${product.name}"`)
      await Promise.all([loadProducts(), loadStats()])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thay đổi trạng thái sản phẩm.')
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete?.raw?.id) {
      setPendingDelete(null)
      return
    }

    const deletedProduct = pendingDelete
    setPendingDelete(null)
    try {
      await deleteProduct(deletedProduct.raw.id)
      await Promise.all([loadProducts(), loadStats()])
      toast(({ closeToast }) => (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#2f1717]">Đã xóa mềm “{deletedProduct.name}”.</p>
          <button
            className="rounded-lg bg-[#c70039] px-3 py-2 text-xs font-extrabold text-white"
            onClick={async () => {
              try {
                await restoreProduct(deletedProduct.raw.id)
                await Promise.all([loadProducts(), loadStats()])
                toast.success('Đã khôi phục sản phẩm.')
              } catch {
                toast.error('Không thể khôi phục sản phẩm.')
              } finally {
                closeToast?.()
              }
            }}
            type="button"
          >
            Hoàn tác
          </button>
        </div>
      ), { autoClose: 9000 })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm.')
    }
  }

  const handleExport = async () => {
    const toastId = toast.loading('\u0110ang t\u1EA3i to\u00E0n b\u1ED9 s\u1EA3n ph\u1EA9m...')
    try {
      const XLSX = await import('xlsx')
      const response = await getProducts({ page: 0, size: 9999, sortBy: 'newest' })
      const allProducts = (response.content || []).map(mapApiProduct)

      const rows = allProducts.map((product) => {
        const raw = product.raw || {}
        const specs = raw.specifications && typeof raw.specifications === 'object'
          ? Object.entries(raw.specifications).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : ''
        return {
          'ID': raw.id ?? '',
          'T\u00EAn s\u1EA3n ph\u1EA9m': product.name,
          'M\u00E3 SKU': product.sku,
          'Danh m\u1EE5c': product.category,
          'Th\u01B0\u01A1ng hi\u1EC7u': raw.factory ?? '',
          '\u0110\u1ED1i t\u01B0\u1EE3ng': raw.target ?? '',
          'Gi\u00E1 b\u00E1n (\u0111)': Number(raw.price ?? 0),
          'Gi\u00E1 g\u1ED1c (\u0111)': Number(raw.originalPrice ?? 0),
          'Gi\u1EA3m gi\u00E1 (%)': raw.discountPercent ?? 0,
          'T\u1ED3n kho': product.stock,
          '\u0110\u00E3 b\u00E1n': product.sold,
          'Tr\u1EA1ng th\u00E1i': product.status,
          'Nh\u00E0 cung c\u1EA5p': raw.supplierName ?? '',
          'M\u00F4 t\u1EA3 ng\u1EAFn': raw.shortDesc ?? '',
          '\u0110\u00E1nh gi\u00E1 TB': raw.averageRating ?? 0,
          'S\u1ED1 l\u01B0\u1EE3t \u0111\u00E1nh gi\u00E1': raw.reviewCount ?? 0,
          'Ngu\u1ED3n': raw.sourceSite ?? '',
          'Th\u00F4ng s\u1ED1 k\u1EF9 thu\u1EADt': specs,
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(rows)
      worksheet['!cols'] = [
        { wch: 8 },  // ID
        { wch: 45 }, // T\u00EAn s\u1EA3n ph\u1EA9m
        { wch: 14 }, // M\u00E3 SKU
        { wch: 18 }, // Danh m\u1EE5c
        { wch: 16 }, // Th\u01B0\u01A1ng hi\u1EC7u
        { wch: 16 }, // \u0110\u1ED1i t\u01B0\u1EE3ng
        { wch: 16 }, // Gi\u00E1 b\u00E1n
        { wch: 16 }, // Gi\u00E1 g\u1ED1c
        { wch: 12 }, // Gi\u1EA3m gi\u00E1
        { wch: 10 }, // T\u1ED3n kho
        { wch: 10 }, // \u0110\u00E3 b\u00E1n
        { wch: 16 }, // Tr\u1EA1ng th\u00E1i
        { wch: 20 }, // Nh\u00E0 cung c\u1EA5p
        { wch: 40 }, // M\u00F4 t\u1EA3 ng\u1EAFn
        { wch: 12 }, // \u0110\u00E1nh gi\u00E1 TB
        { wch: 14 }, // S\u1ED1 l\u01B0\u1EE3t \u0111\u00E1nh gi\u00E1
        { wch: 14 }, // Ngu\u1ED3n
        { wch: 60 }, // Th\u00F4ng s\u1ED1 k\u1EF9 thu\u1EADt
      ]
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'S\u1EA3n ph\u1EA9m')
      XLSX.writeFile(workbook, 'smartshop-products.xlsx')
      toast.update(toastId, { render: `\u0110\u00E3 xu\u1EA5t ${allProducts.length} s\u1EA3n ph\u1EA9m.`, type: 'success', isLoading: false, autoClose: 3000 })
    } catch {
      toast.update(toastId, { render: 'Kh\u00F4ng th\u1EC3 xu\u1EA5t file.', type: 'error', isLoading: false, autoClose: 3000 })
    }
  }

  return (
    <div className="flex min-h-full w-full flex-col p-6 lg:p-8">
      <PageHeader
        title="Quản lý sản phẩm"
        breadcrumb={[{ label: 'Admin' }, { label: 'Sản phẩm' }]}
        actions={
          <>
            <Button variant="secondary" size="md" onClick={handleExport}>
              <Download size={15} />
              Xuất file
            </Button>
            <Button size="md" onClick={() => setModal({ mode: 'create' })}>
              <Plus size={15} />
              Thêm sản phẩm
            </Button>
          </>
        }
      />

      <div className="mb-6">
        <StatsCardsView stats={stats} />
      </div>

      <div className="mb-6">
        <ProductFilters
          categories={categories}
          onApply={handleApplyFilters}
          onChange={setFilters}
          onReset={handleResetFilters}
          value={filters}
        />
      </div>

      <div className="mb-6">
        <ProductsTable
          loading={loading}
          onDelete={setPendingDelete}
          onEdit={(product) => setModal({ mode: 'edit', product })}
          onToggleActive={handleToggleActive}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(0)
          }}
          onView={(product) => setModal({ mode: 'view', product })}
          page={page}
          pageSize={pageSize}
          products={products}
          totalItems={totalItems}
          totalPages={totalPages}
        />
      </div>

      {modal && (
        <ProductFormModal
          categories={categories}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSubmit={handleSave}
          product={'product' in modal ? modal.product : null}
          saving={saving}
          suppliers={suppliers}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={'Xoa san pham?'}
        description={`San pham “${pendingDelete?.name}” se bi an khoi danh sach. Ban co the hoan tac ngay sau khi xoa.`}
        confirmLabel={'Xoa mem'}
      />
    </div>
  )
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileUp, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { createProduct, deleteProduct, getProducts, importProductsJson, restoreProduct, toggleProductActive, updateProduct } from '../../api/products'
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

function getRowValue(row: Record<string, any>, keys: string[]) {
  const match = Object.keys(row).find((key) => keys.includes(key.trim().toLowerCase()))
  return match ? row[match] : ''
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
  const importInputRef = useRef<HTMLInputElement | null>(null)

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
    const XLSX = await import('xlsx')
    const rows = products.map((product) => ({
      'T\u00EAn s\u1EA3n ph\u1EA9m': product.name,
      'M\u00E3 SKU': product.sku,
      'Danh m\u1EE5c': product.category,
      'Gi\u00E1 b\u00E1n': product.price,
      'T\u1ED3n kho': product.stock,
      '\u0110\u00E3 b\u00E1n': product.sold,
      'Tr\u1EA1ng th\u00E1i': product.status,
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    // \u0110\u1EB7t \u0111\u1ED9 r\u1ED9ng c\u1ED9t h\u1EE3p l\u00FD
    worksheet['!cols'] = [
      { wch: 40 }, // T\u00EAn s\u1EA3n ph\u1EA9m
      { wch: 14 }, // M\u00E3 SKU
      { wch: 18 }, // Danh m\u1EE5c
      { wch: 16 }, // Gi\u00E1 b\u00E1n
      { wch: 10 }, // T\u1ED3n kho
      { wch: 10 }, // \u0110\u00E3 b\u00E1n
      { wch: 16 }, // Tr\u1EA1ng th\u00E1i
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'S\u1EA3n ph\u1EA9m')
    XLSX.writeFile(workbook, 'smartshop-products.xlsx')
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const payload = JSON.parse(await file.text())
        await importProductsJson(payload)
        toast.success('Đã nhập sản phẩm từ JSON.')
      } else {
        const XLSX = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)
        for (const row of rows) {
          const name = String(getRowValue(row, ['name', 'tên sản phẩm', 'ten san pham']) || '').trim()
          if (!name) continue
          await createProduct(buildFormData({
            name,
            price: String(getRowValue(row, ['price', 'giá', 'gia', 'giá bán', 'gia ban']) || 0),
            quantity: String(getRowValue(row, ['quantity', 'stock', 'tồn kho', 'ton kho']) || 1),
            shortDesc: String(getRowValue(row, ['shortdesc', 'mô tả ngắn', 'mo ta ngan']) || name),
            detailDesc: String(getRowValue(row, ['detaildesc', 'mô tả chi tiết', 'mo ta chi tiet']) || name),
            factory: String(getRowValue(row, ['brand', 'factory', 'thương hiệu', 'thuong hieu']) || ''),
            target: String(getRowValue(row, ['target', 'đối tượng', 'doi tuong']) || ''),
            categoryId: String(getRowValue(row, ['categoryid', 'category id', 'mã danh mục', 'ma danh muc']) || ''),
            supplierId: String(getRowValue(row, ['supplierid', 'supplier id', 'mã nhà cung cấp', 'ma nha cung cap']) || ''),
          }))
        }
        toast.success(`Đã nhập ${rows.length} dòng từ Excel.`)
      }
      await loadProducts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Không thể nhập file.')
    }
  }

  return (
    <div className="flex min-h-full w-full flex-col p-6 lg:p-8">
      <PageHeader
        title="Quản lý sản phẩm"
        breadcrumb={[{ label: 'Admin' }, { label: 'Sản phẩm' }]}
        actions={
          <>
            <input ref={importInputRef} accept=".xlsx,.xls,.csv,.json,application/json" className="hidden" onChange={handleImport} type="file" />
            <Button variant="secondary" size="md" onClick={() => importInputRef.current?.click()}>
              <FileUp size={15} />
              Nhập Excel
            </Button>
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

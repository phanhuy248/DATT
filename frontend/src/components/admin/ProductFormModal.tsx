import React, { useEffect, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import type { AdminProduct } from '../../mock/products'
import { getImageUrl } from '../../utils/image'

type Option = {
  id: string | number
  name: string
}

export type ProductFormValue = {
  name: string
  price: string
  quantity: string
  shortDesc: string
  detailDesc: string
  factory: string
  target: string
  categoryId: string
  supplierId: string
}

type ProductFormModalProps = {
  mode: 'view' | 'create' | 'edit'
  product?: AdminProduct | null
  categories: Option[]
  suppliers: Option[]
  saving: boolean
  onClose: () => void
  onSubmit: (value: ProductFormValue, imageFile: File | null) => void
}

const emptyValue: ProductFormValue = {
  name: '',
  price: '',
  quantity: '',
  shortDesc: '',
  detailDesc: '',
  factory: '',
  target: '',
  categoryId: '',
  supplierId: '',
}

function toFormValue(product?: AdminProduct | null): ProductFormValue {
  const raw = product?.raw || {}
  return {
    name: raw.name || product?.name || '',
    price: raw.price != null ? String(raw.price) : '',
    quantity: raw.quantity != null ? String(raw.quantity) : product?.stock != null ? String(product.stock) : '',
    shortDesc: raw.shortDesc || '',
    detailDesc: raw.detailDesc || '',
    factory: raw.factory || '',
    target: raw.target || '',
    categoryId: raw.categoryId != null ? String(raw.categoryId) : '',
    supplierId: raw.supplierId != null ? String(raw.supplierId) : '',
  }
}

export default function ProductFormModal({ mode, product, categories, suppliers, saving, onClose, onSubmit }: ProductFormModalProps) {
  const [value, setValue] = useState<ProductFormValue>(emptyValue)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const readonly = mode === 'view'

  useEffect(() => {
    setValue(mode === 'create' ? emptyValue : toFormValue(product))
    setImageFile(null)
    setPreview(product?.raw?.image ? getImageUrl(product.raw.image) : product?.image || '')
  }, [mode, product])

  const update = (patch: Partial<ProductFormValue>) => setValue((current) => ({ ...current, ...patch }))

  return (
    <div className="fixed inset-0 z-[1300] flex items-start justify-center overflow-y-auto bg-[#1d0f0f]/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[24px] border border-rose-100 bg-white shadow-[0_24px_60px_rgba(31,15,15,0.24)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xl font-extrabold text-[#1d0f0f]">
              {mode === 'create' ? 'Thêm sản phẩm' : mode === 'edit' ? 'Chỉnh sửa sản phẩm' : 'Chi tiết sản phẩm'}
            </p>
            <p className="mt-1 text-sm text-[#6b4b4a]">{product?.sku || 'Tạo sản phẩm mới trong hệ thống'}</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl text-[#4a2c2b] transition hover:bg-rose-50 hover:text-[#c70039]" onClick={onClose} type="button" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form
          className="space-y-5 p-6"
          onSubmit={(event) => {
            event.preventDefault()
            if (!readonly) onSubmit(value, imageFile)
          }}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[180px_1fr]">
            <div>
              <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-rose-50 ring-1 ring-slate-100">
                {preview ? <img className="h-full w-full object-contain p-4" src={preview} alt={value.name} /> : <ImagePlus className="text-slate-300" size={38} />}
              </div>
              {!readonly && (
                <label className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-[#4a2c2b] transition hover:border-[#c70039] hover:text-[#c70039]">
                  <ImagePlus size={17} />
                  Chọn ảnh
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null
                      setImageFile(file)
                      if (file) setPreview(URL.createObjectURL(file))
                    }}
                    type="file"
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-extrabold text-[#4a2c2b]">Tên sản phẩm</span>
                <input className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:text-slate-500" disabled={readonly} onChange={(event) => update({ name: event.target.value })} value={value.name} required />
              </label>
              <label>
                <span className="mb-2 block text-sm font-extrabold text-[#4a2c2b]">Giá bán</span>
                <input className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:text-slate-500" disabled={readonly} onChange={(event) => update({ price: event.target.value })} type="number" value={value.price} required />
              </label>
              <label>
                <span className="mb-2 block text-sm font-extrabold text-[#4a2c2b]">Tồn kho</span>
                <input className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:text-slate-500" disabled={readonly} onChange={(event) => update({ quantity: event.target.value })} type="number" value={value.quantity} required />
              </label>
              <label>
                <span className="mb-2 block text-sm font-extrabold text-[#4a2c2b]">Danh mục</span>
                <select className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:text-slate-500" disabled={readonly} onChange={(event) => update({ categoryId: event.target.value })} value={value.categoryId}>
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-extrabold text-[#4a2c2b]">Nhà cung cấp</span>
                <select className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:text-slate-500" disabled={readonly} onChange={(event) => update({ supplierId: event.target.value })} value={value.supplierId}>
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-extrabold text-[#4a2c2b]">Thương hiệu</span>
                <input className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:text-slate-500" disabled={readonly} onChange={(event) => update({ factory: event.target.value })} value={value.factory} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-extrabold text-[#4a2c2b]">Đối tượng</span>
                <input className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:text-slate-500" disabled={readonly} onChange={(event) => update({ target: event.target.value })} value={value.target} />
              </label>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-[#4a2c2b]">Mô tả ngắn</span>
            <textarea className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:text-slate-500" disabled={readonly} onChange={(event) => update({ shortDesc: event.target.value })} value={value.shortDesc} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-[#4a2c2b]">Mô tả chi tiết</span>
            <textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:text-slate-500" disabled={readonly} onChange={(event) => update({ detailDesc: event.target.value })} value={value.detailDesc} required />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-extrabold text-[#4a2c2b] transition hover:border-[#c70039] hover:text-[#c70039]" onClick={onClose} type="button">
              {readonly ? 'Đóng' : 'Hủy'}
            </button>
            {!readonly && (
              <button className="h-12 rounded-xl bg-[#c70039] px-6 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(199,0,57,0.22)] transition hover:bg-[#ad0032] disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="submit">
                {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

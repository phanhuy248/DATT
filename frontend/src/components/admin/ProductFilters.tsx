import React from 'react'
import { ChevronDown, RotateCcw, Search } from 'lucide-react'
import { motion } from 'framer-motion'

type Option = {
  id: string | number
  name: string
}

export type ProductFiltersValue = {
  keyword: string
  categoryId: string
  status: string
  minPrice: string
  maxPrice: string
}

type ProductFiltersProps = {
  categories: Option[]
  value: ProductFiltersValue
  onChange: (value: ProductFiltersValue) => void
  onApply: () => void
  onReset: () => void
}

export default function ProductFilters({ categories, value, onChange, onApply, onReset }: ProductFiltersProps) {
  const update = (patch: Partial<ProductFiltersValue>) => onChange({ ...value, ...patch })

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-[22px] border border-slate-100 bg-white p-6 shadow-[0_14px_30px_rgba(53,32,32,0.10)]"
    >
      <form
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[1.45fr_1.05fr_1.05fr_1.4fr]"
        onSubmit={(event) => {
          event.preventDefault()
          onApply()
        }}
      >
        <label className="block">
          <span className="mb-3 block text-base font-extrabold text-[#4a2c2b]">Tìm kiếm</span>
          <span className="relative flex h-14 items-center">
            <Search className="absolute left-4 text-[#4a2c2b]" size={22} />
            <input
              className="h-full w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-[15px] text-[#2f1717] outline-none transition placeholder:text-slate-500 focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100"
              onChange={(event) => update({ keyword: event.target.value })}
              placeholder="Tên sản phẩm hoặc SKU"
              type="search"
              value={value.keyword}
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-3 block text-base font-extrabold text-[#4a2c2b]">Danh mục</span>
          <span className="relative flex h-14 items-center">
            <select
              className="h-full w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-5 pr-11 text-base font-medium text-[#2f1717] outline-none transition hover:border-[#c70039] focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100"
              onChange={(event) => update({ categoryId: event.target.value })}
              value={value.categoryId}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 text-slate-500" size={20} />
          </span>
        </label>

        <label className="block">
          <span className="mb-3 block text-base font-extrabold text-[#4a2c2b]">Trạng thái</span>
          <span className="relative flex h-14 items-center">
            <select
              className="h-full w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-5 pr-11 text-base font-medium text-[#2f1717] outline-none transition hover:border-[#c70039] focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100"
              onChange={(event) => update({ status: event.target.value })}
              value={value.status}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Còn hàng">Còn hàng</option>
              <option value="Sắp hết hàng">Sắp hết hàng</option>
              <option value="Hết hàng">Hết hàng</option>
              <option value="Tạm dừng">Tạm dừng</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 text-slate-500" size={20} />
          </span>
        </label>

        <label className="block">
          <span className="mb-3 block text-base font-extrabold text-[#4a2c2b]">Khoảng giá</span>
          <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <input
              className="h-14 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition placeholder:text-slate-500 focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100"
              onChange={(event) => update({ minPrice: event.target.value })}
              placeholder="Min"
              type="number"
              value={value.minPrice}
            />
            <span className="font-bold text-slate-400">-</span>
            <input
              className="h-14 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition placeholder:text-slate-500 focus:border-[#c70039] focus:bg-white focus:ring-4 focus:ring-rose-100"
              onChange={(event) => update({ maxPrice: event.target.value })}
              placeholder="Max"
              type="number"
              value={value.maxPrice}
            />
          </span>
        </label>
      </form>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2f1717] px-6 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(47,23,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#442525]" onClick={onApply} type="button">
          <Search size={18} />
          Tìm kiếm
        </button>
        <button className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-extrabold text-[#4a2c2b] transition hover:-translate-y-0.5 hover:border-[#c70039] hover:text-[#c70039]" onClick={onReset} type="button">
          <RotateCcw size={18} />
          Đặt lại
        </button>
      </div>
    </motion.section>
  )
}

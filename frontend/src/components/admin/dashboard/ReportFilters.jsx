import React, { useState } from 'react'
import { Calendar, ChevronDown, FileDown, FileSpreadsheet, Filter } from 'lucide-react'

const PRESETS = [
  { label: 'Hôm nay',     key: 'today' },
  { label: '7 ngày',      key: '7d' },
  { label: '30 ngày',     key: '30d' },
  { label: 'Tháng này',   key: 'thisMonth' },
  { label: 'Tháng trước', key: 'lastMonth' },
  { label: 'Năm nay',     key: 'thisYear' },
  { label: 'Tùy chỉnh',   key: 'custom' },
]

const GROUP_BY = [
  { label: 'Ngày',  value: 'day' },
  { label: 'Tuần',  value: 'week' },
  { label: 'Tháng', value: 'month' },
]

function subtractDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function computePresetDates(key) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  switch (key) {
    case 'today':
      return { from: today, to: today }
    case '7d':
      return { from: subtractDays(today, 6), to: today }
    case '30d':
      return { from: subtractDays(today, 29), to: today }
    case 'thisMonth':
      return { from: `${today.slice(0, 7)}-01`, to: today }
    case 'lastMonth': {
      const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      const month = now.getMonth() === 0 ? 12 : now.getMonth()
      const last  = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
      const mm    = String(month).padStart(2, '0')
      return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(last).padStart(2, '0')}` }
    }
    case 'thisYear':
      return { from: `${now.getFullYear()}-01-01`, to: today }
    default:
      return null
  }
}

const SELECT_CLS =
  'h-10 min-w-[160px] appearance-none rounded-xl border border-rose-200 bg-white px-4 pr-9 text-sm font-medium text-[#5f403f] outline-none transition hover:border-[#c70039] focus:border-[#c70039] focus:ring-2 focus:ring-rose-100'

export default function ReportFilters({
  preset,
  dateFrom,
  dateTo,
  groupBy,
  categories = [],
  category,
  brands = [],
  brand,
  onPreset,
  onDatesApply,
  onGroupByChange,
  onCategoryChange,
  onBrandChange,
  onExportExcel,
  onExportPdf,
}) {
  // draft dates — only committed to parent when "Áp dụng" clicked
  const [draftFrom, setDraftFrom] = useState(dateFrom)
  const [draftTo,   setDraftTo]   = useState(dateTo)

  const handlePreset = (key) => {
    if (key === 'custom') {
      onPreset('custom', null, null)
    } else {
      const dates = computePresetDates(key)
      setDraftFrom(dates.from)
      setDraftTo(dates.to)
      onPreset(key, dates.from, dates.to)
    }
  }

  const handleApply = () => {
    onDatesApply(draftFrom, draftTo)
  }

  return (
    <section className="rounded-[24px] border border-rose-100 bg-white p-5 shadow-[0_8px_22px_rgba(31,24,24,0.06)] space-y-3">

      {/* Row 1 — Preset pills + custom date inputs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap rounded-2xl bg-[#f4f7fa] p-1 gap-0.5">
          {PRESETS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`h-9 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition ${
                preset === item.key
                  ? 'bg-white text-[#c70039] shadow-sm'
                  : 'text-[#2f2020] hover:bg-white/70'
              }`}
              onClick={() => handlePreset(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <Calendar size={15} className="shrink-0 text-[#5f403f]" />
            <input
              type="date"
              value={draftFrom}
              max={draftTo || undefined}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="h-10 rounded-xl border border-rose-200 bg-white px-3 text-sm text-[#3b2525] outline-none focus:border-[#c70039] focus:ring-2 focus:ring-rose-100"
            />
            <span className="text-[#9a7a79]">→</span>
            <input
              type="date"
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(e) => setDraftTo(e.target.value)}
              className="h-10 rounded-xl border border-rose-200 bg-white px-3 text-sm text-[#3b2525] outline-none focus:border-[#c70039] focus:ring-2 focus:ring-rose-100"
            />
          </div>
        )}
      </div>

      {/* Row 2 — GroupBy + Category + Brand + Actions */}
      <div className="flex flex-wrap items-center gap-3">

        {/* GroupBy toggle */}
        <div className="flex overflow-hidden rounded-xl border border-rose-200">
          {GROUP_BY.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`h-10 px-5 text-sm font-bold transition ${
                groupBy === opt.value
                  ? 'bg-[#c70039] text-white'
                  : 'bg-white text-[#5f403f] hover:bg-rose-50'
              }`}
              onClick={() => onGroupByChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category */}
        <label className="relative">
          <select className={SELECT_CLS} value={category} onChange={(e) => onCategoryChange(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5f403f]" size={14} />
        </label>

        {/* Brand */}
        <label className="relative">
          <select className={SELECT_CLS} value={brand} onChange={(e) => onBrandChange(e.target.value)}>
            <option value="">Tất cả thương hiệu</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5f403f]" size={14} />
        </label>

        {/* Buttons */}
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-xl bg-[#1d2838] px-5 text-sm font-bold text-white shadow-[0_6px_14px_rgba(29,40,56,0.18)] transition hover:bg-[#2b3445]"
          onClick={handleApply}
        >
          <Filter size={14} />
          Áp dụng
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-[#5f403f] transition hover:border-[#c70039] hover:text-[#c70039]"
          onClick={onExportExcel}
        >
          <FileSpreadsheet size={14} />
          Excel
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-[#5f403f] transition hover:border-[#c70039] hover:text-[#c70039]"
          onClick={onExportPdf}
        >
          <FileDown size={14} />
          PDF
        </button>
      </div>
    </section>
  )
}

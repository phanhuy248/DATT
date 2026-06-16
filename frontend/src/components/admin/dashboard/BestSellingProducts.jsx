import React from 'react'

export default function BestSellingProducts({ products, onDetail }) {
  return (
    <section className="rounded-[24px] border border-rose-50 bg-white shadow-[0_14px_30px_rgba(31,24,24,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-6">
        <h2 className="text-xl font-extrabold text-[#1d0f0f]">Bán chạy nhất</h2>
        <button className="text-sm font-extrabold text-[#c70039]" onClick={onDetail} type="button">Chi tiết</button>
      </div>
      <div className="space-y-5 p-6">
        {products.length === 0 && <p className="py-8 text-center text-sm font-semibold text-slate-500">Chưa có dữ liệu bán chạy.</p>}
        {products.map((product) => (
          <article key={product.id} className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-rose-50 ring-1 ring-slate-100">
              {product.image ? <img className="h-14 w-14 object-contain" src={product.image} alt={product.name} /> : <span className="text-[10px] font-extrabold text-slate-300">IMG</span>}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-extrabold text-[#1d0f0f]">{product.name}</h3>
              <p className="mt-1 text-[11px] font-extrabold uppercase text-[#5f403f]">{product.category} • {product.brand}</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-[#c70039]">{product.price}</p>
              <p className="mt-1 text-[11px] font-bold text-[#006b57]">{product.sold}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

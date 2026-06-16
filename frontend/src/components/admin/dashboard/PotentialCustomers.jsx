import React from 'react'
import { Plus } from 'lucide-react'
import AvatarBadge from './AvatarBadge'

export default function PotentialCustomers({ customers, onViewAll }) {
  return (
    <section className="rounded-[24px] border border-rose-50 bg-white shadow-[0_14px_30px_rgba(31,24,24,0.08)]">
      <div className="border-b border-slate-100 px-6 py-6">
        <h2 className="text-xl font-extrabold text-[#1d0f0f]">Khách hàng tiềm năng</h2>
      </div>
      <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {customers.length === 0 && (
          <div className="px-6 py-10 text-center text-sm font-semibold text-slate-500 xl:col-span-4">
            Chưa có dữ liệu khách hàng tiềm năng.
          </div>
        )}
        {customers.map((customer) => (
          <article key={customer.id} className="flex flex-col items-center px-6 py-7 text-center">
            <AvatarBadge name={customer.name} tone={customer.avatarTone} />
            <h3 className="mt-4 text-base font-extrabold text-[#1d0f0f]">{customer.name}</h3>
            <p className="mt-1 text-[11px] font-extrabold uppercase text-[#c70039]">{customer.rank}</p>
            <p className="mt-2 text-sm text-[#5f403f]">{customer.orders}</p>
            <p className="mt-1 text-sm font-extrabold text-[#1d0f0f]">{customer.spending}</p>
          </article>
        ))}
        <div className="flex flex-col items-center justify-center px-6 py-7 text-center">
          <button className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-300 text-[#c70039] transition hover:bg-rose-50" onClick={onViewAll} type="button" aria-label="Xem tất cả khách hàng">
            <Plus size={22} />
          </button>
          <p className="mt-5 text-sm font-bold text-[#1d0f0f]">Xem tất cả</p>
        </div>
      </div>
    </section>
  )
}

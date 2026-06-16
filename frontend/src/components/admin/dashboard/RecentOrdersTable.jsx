import React from 'react'
import { Eye, MoreHorizontal } from 'lucide-react'
import AvatarBadge from './AvatarBadge'

const badgeClass = {
  'Chờ xác nhận': 'bg-orange-100 text-orange-700',
  'Đã xác nhận': 'bg-indigo-100 text-indigo-700',
  'Đang giao': 'bg-blue-100 text-blue-700',
  'Hoàn tất': 'bg-emerald-100 text-emerald-700',
  'Đã hủy': 'bg-red-100 text-red-700',
}

export default function RecentOrdersTable({ orders, onViewAll, onViewOrder }) {
  return (
    <section className="rounded-[24px] border border-rose-50 bg-white shadow-[0_14px_30px_rgba(31,24,24,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-6">
        <h2 className="text-xl font-extrabold text-[#1d0f0f]">Đơn hàng gần đây</h2>
        <button className="text-sm font-extrabold text-[#c70039]" onClick={onViewAll} type="button">Xem tất cả</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-left">
          <thead className="bg-[#fbfcfd]">
            <tr className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#5f403f]">
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-4 py-4">Mã đơn</th>
              <th className="px-4 py-4">Ngày đặt</th>
              <th className="px-4 py-4">Tổng tiền</th>
              <th className="px-4 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td className="px-6 py-10 text-center text-sm font-semibold text-slate-500" colSpan={6}>Chưa có đơn hàng gần đây.</td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100 transition hover:bg-rose-50/30">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <AvatarBadge name={order.customer} tone={order.avatarTone} size="sm" />
                    <span className="max-w-[110px] font-extrabold leading-5 text-[#1d0f0f]">{order.customer}</span>
                  </div>
                </td>
                <td className="px-4 py-5 font-semibold text-[#1d0f0f]">{order.id}</td>
                <td className="px-4 py-5 text-[#5f403f]">{order.date}</td>
                <td className="px-4 py-5 font-extrabold text-[#c70039]">{order.total}</td>
                <td className="px-4 py-5">
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase ${badgeClass[order.status] || 'bg-slate-100 text-slate-700'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 text-[#5f403f] transition hover:border-[#c70039] hover:text-[#c70039]" onClick={() => onViewOrder?.(order)} type="button" aria-label="Xem đơn hàng">
                      <Eye size={16} />
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 text-[#5f403f] transition hover:border-[#c70039] hover:text-[#c70039]" onClick={onViewAll} type="button" aria-label="Tùy chọn đơn hàng">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

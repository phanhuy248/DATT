import React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const { revenue, ordersCount } = payload[0]?.payload || {}
  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-[0_16px_30px_rgba(31,24,24,0.12)]">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#5f403f]">{label}</p>
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#d75b7a]" />
          <span className="text-[#3b2525]">Doanh thu:</span>
          <strong className="text-[#1d0f0f]">{revenue}M</strong>
        </div>
        {ordersCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#f4a8b8]" />
            <span className="text-[#3b2525]">Đơn hàng:</span>
            <strong className="text-[#1d0f0f]">{ordersCount}</strong>
          </div>
        )}
      </div>
    </div>
  )
}

const GROUP_BY_LABEL = { day: 'theo ngày', week: 'theo tuần', month: 'theo tháng' }

export default function RevenueChart({ data = [], groupBy = 'day', periodLabel }) {
  const hasData = data.some((d) => d.revenue > 0)

  return (
    <section className="rounded-[24px] border border-rose-50 bg-white p-6 shadow-[0_14px_30px_rgba(31,24,24,0.08)]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#1d0f0f]">Phân tích doanh thu</h2>
          <p className="mt-1 text-sm text-[#7a5f5f]">
            {periodLabel || '30 ngày qua'} · {GROUP_BY_LABEL[groupBy] || 'theo ngày'} · Đơn vị: triệu đồng (M)
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#3c2828]">
          <i className="h-3 w-3 rounded-full bg-[#d75b7a]" />
          Doanh thu (đã xử lý)
        </div>
      </div>

      <div className="h-[300px] w-full">
        {hasData ? (
          <ResponsiveContainer>
            <BarChart data={data} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="#f0e4e4" strokeDasharray="4 4" />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9a7a79', fontSize: 11, fontWeight: 600 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9a7a79', fontSize: 11 }}
                tickFormatter={(v) => `${v}M`}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(199,0,57,0.05)' }} />
              <Bar dataKey="revenue" fill="#d75b7a" radius={[10, 10, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
            Chưa có dữ liệu doanh thu trong kỳ này.
          </div>
        )}
      </div>
    </section>
  )
}

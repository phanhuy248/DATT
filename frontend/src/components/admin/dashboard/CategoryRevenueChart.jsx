import React from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export default function CategoryRevenueChart({ data, totalLabel = '0đ' }) {
  const chartData = data.length ? data : [{ name: 'Chưa có dữ liệu', value: 100, color: '#e5e7eb' }]

  return (
    <section className="rounded-[24px] border border-rose-50 bg-white p-6 shadow-[0_14px_30px_rgba(31,24,24,0.08)]">
      <h2 className="text-xl font-extrabold text-[#1d0f0f]">Doanh thu theo ngành</h2>
      <div className="relative mx-auto mt-6 h-[236px] max-w-[260px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chartData} dataKey="value" innerRadius={70} outerRadius={104} startAngle={90} endAngle={450} paddingAngle={0}>
              {chartData.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}%`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
          <strong className="text-3xl font-extrabold text-[#1d0f0f]">{totalLabel}</strong>
          <span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#5f403f]">Tổng cộng</span>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-3 text-sm">
            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="min-w-0 flex-1 truncate text-[#1d0f0f]">{item.name}</span>
            {item.revenueLabel && (
              <span className="shrink-0 text-[11px] text-[#5f403f]">{item.revenueLabel}</span>
            )}
            <strong className="w-9 shrink-0 text-right text-[#1d0f0f]">{item.value}%</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

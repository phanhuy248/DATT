import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadCloud, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  adminStats as fallbackStats,
  bestSellingProducts as fallbackBestSellingProducts,
  categoryRevenue as fallbackCategoryRevenue,
  potentialCustomers as fallbackPotentialCustomers,
  recentOrders as fallbackRecentOrders,
} from '../../data/adminDashboardMock'
import { getCategories } from '../../api/categories'
import {
  getDashboardCategoryRevenue,
  getDashboardOverview,
  getDashboardRevenueGrouped,
  getDashboardTopCustomers,
} from '../../api/dashboard'
import {
  buildCategoryRevenue,
  buildDashboardStats,
  buildGroupedRevenue,
  buildPotentialCustomers,
  buildRecentOrders,
  buildTopProducts,
  compactMoney,
  formatCurrency,
  subtractDays,
} from '../../utils/dashboardHelpers'

import BestSellingProducts from '../../components/admin/dashboard/BestSellingProducts'
import CategoryRevenueChart from '../../components/admin/dashboard/CategoryRevenueChart'
import PotentialCustomers from '../../components/admin/dashboard/PotentialCustomers'
import RecentOrdersTable from '../../components/admin/dashboard/RecentOrdersTable'
import ReportFilters from '../../components/admin/dashboard/ReportFilters'
import RevenueChart from '../../components/admin/dashboard/RevenueChart'
import StatCard from '../../components/admin/dashboard/StatCard'


// ─── Preset label ─────────────────────────────────────────────────────────────

const PRESET_LABEL = {
  today:     'Hôm nay',
  '7d':      '7 ngày qua',
  '30d':     '30 ngày qua',
  thisMonth: 'Tháng này',
  lastMonth: 'Tháng trước',
  thisYear:  'Năm nay',
  custom:    'Tùy chỉnh',
}

function buildPeriodLabel(preset, dateFrom, dateTo) {
  if (preset === 'custom') return `${dateFrom} → ${dateTo}`
  return PRESET_LABEL[preset] || '30 ngày qua'
}

// ─── Component ────────────────────────────────────────────────────────────────

const todayStr = new Date().toISOString().slice(0, 10)

export default function DashboardPage() {
  const navigate = useNavigate()

  // ── Overview state (loaded once on mount) ──────────────────────────────────
  const [overview, setOverview]     = useState(null)
  const [stats, setStats]           = useState(fallbackStats)
  const [recentOrders, setRecentOrders] = useState(fallbackRecentOrders)
  const [topProducts, setTopProducts]   = useState(fallbackBestSellingProducts)
  const [topCustomers, setTopCustomers] = useState(fallbackPotentialCustomers)
  const [loading, setLoading]       = useState(true)

  // ── Category list ──────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([])

  // ── Chart filter state ─────────────────────────────────────────────────────
  const [preset,   setPreset]   = useState('30d')
  const [dateFrom, setDateFrom] = useState(subtractDays(todayStr, 29))
  const [dateTo,   setDateTo]   = useState(todayStr)
  const [groupBy,  setGroupBy]  = useState('day')
  const [category, setCategory] = useState('')   // category name (for client + server filter)
  const [brand,    setBrand]    = useState('')

  // ── Chart data state ───────────────────────────────────────────────────────
  const [revenueData,   setRevenueData]   = useState([])
  const [categoryRows,  setCategoryRows]  = useState([])
  const [chartLoading,  setChartLoading]  = useState(false)

  // ── Derived ────────────────────────────────────────────────────────────────

  // categoryId for server-side revenue filter
  const chartCategoryId = useMemo(
    () => categories.find((c) => c.name === category)?.id ?? null,
    [categories, category]
  )

  // brand list for filter dropdown
  const brands = useMemo(
    () => [...new Set(topProducts.map((p) => p.brand).filter(Boolean))],
    [topProducts]
  )

  // filtered top-products for the sidebar widget (client-side)
  const visibleTopProducts = useMemo(() => {
    let result = topProducts
    if (category) result = result.filter((p) => p.category === category)
    if (brand)    result = result.filter((p) => p.brand === brand)
    return result
  }, [brand, category, topProducts])

  // donut chart data (all categories, no filter — ratio between them stays meaningful)
  const visibleCategoryRevenue = useMemo(() => buildCategoryRevenue(categoryRows), [categoryRows])

  const categoryTotalLabel = useMemo(
    () => (overview ? compactMoney(overview.deliveredRevenue) : '0đ'),
    [overview]
  )

  const periodLabel = useMemo(
    () => buildPeriodLabel(preset, dateFrom, dateTo),
    [preset, dateFrom, dateTo]
  )

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadOverview = useCallback(async () => {
    setLoading(true)
    const [overviewResult, customersResult] = await Promise.allSettled([
      getDashboardOverview(),
      getDashboardTopCustomers(4),
    ])
    if (overviewResult.status === 'fulfilled') {
      const next = overviewResult.value
      const nextCustomers =
        customersResult.status === 'fulfilled' ? buildPotentialCustomers(customersResult.value) : []
      setOverview(next)
      setStats(buildDashboardStats(next, nextCustomers))
      setRecentOrders(buildRecentOrders(next.recentOrders))
      setTopProducts(buildTopProducts(next.topSellingProducts))
      setTopCustomers(nextCustomers)
    } else {
      setOverview(null)
      setStats(fallbackStats)
      setRecentOrders(fallbackRecentOrders)
      setTopProducts(fallbackBestSellingProducts)
      setTopCustomers(fallbackPotentialCustomers)
      toast.warn('Chưa tải được dữ liệu dashboard, đang hiển thị dữ liệu mẫu.')
    }
    setLoading(false)
  }, [])

  const loadChartData = useCallback(async () => {
    setChartLoading(true)
    const [revenueResult, categoryResult] = await Promise.allSettled([
      getDashboardRevenueGrouped({
        dateFrom,
        dateTo,
        groupBy,
        ...(chartCategoryId != null && { categoryId: chartCategoryId }),
        ...(brand && { brand }),
      }),
      getDashboardCategoryRevenue({ ...(brand && { brand }) }),
    ])
    setRevenueData(
      revenueResult.status === 'fulfilled'
        ? buildGroupedRevenue(revenueResult.value, groupBy)
        : []
    )
    setCategoryRows(
      categoryResult.status === 'fulfilled'
        ? categoryResult.value || []
        : fallbackCategoryRevenue.map((item) => ({ category: item.name, revenue: item.value }))
    )
    setChartLoading(false)
  }, [dateFrom, dateTo, groupBy, chartCategoryId, brand])

  useEffect(() => { loadOverview() },   [loadOverview])
  useEffect(() => { loadChartData() },  [loadChartData])
  useEffect(() => { getCategories().then(setCategories).catch(() => setCategories([])) }, [])

  // ── Filter handlers ────────────────────────────────────────────────────────

  const handlePreset = (key, from, to) => {
    setPreset(key)
    if (from && to) {
      setDateFrom(from)  // batched with setDateTo → one loadChartData call
      setDateTo(to)
    }
  }

  const handleDatesApply = (from, to) => {
    setDateFrom(from)
    setDateTo(to)
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // Sheet 1: Tổng quan KPI
    const overviewRows = [
      { 'Chỉ số': 'Kỳ báo cáo', 'Giá trị': periodLabel },
      { 'Chỉ số': 'Doanh thu (đã hoàn tất)', 'Giá trị': overview ? formatCurrency(overview.deliveredRevenue) : fallbackStats[0].value },
      { 'Chỉ số': 'Tổng giá trị đơn hàng', 'Giá trị': overview ? formatCurrency(overview.totalRevenue) : '' },
      { 'Chỉ số': 'Tổng đơn hàng', 'Giá trị': overview?.totalOrders ?? fallbackStats[1].value },
      { 'Chỉ số': 'Tổng sản phẩm', 'Giá trị': overview?.totalProducts ?? fallbackStats[2].value },
      { 'Chỉ số': 'Tổng khách hàng', 'Giá trị': overview?.totalUsers ?? fallbackStats[3].value },
    ]
    const ws1 = XLSX.utils.json_to_sheet(overviewRows)
    ws1['!cols'] = [{ wch: 30 }, { wch: 22 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan')

    // Sheet 2: Doanh thu theo thời gian
    if (revenueData.length > 0) {
      const revenueRows = revenueData.map((d) => ({
        'Kỳ': d.period,
        'Doanh thu (triệu đồng)': d.revenue,
        'Số đơn hàng': d.ordersCount,
      }))
      const ws2 = XLSX.utils.json_to_sheet(revenueRows)
      ws2['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, ws2, 'Doanh thu')
    }

    // Sheet 3: Doanh thu theo danh mục
    if (categoryRows.length > 0) {
      const catRows = categoryRows.map((r) => ({
        'Danh mục': r.category,
        'Doanh thu (đồng)': r.revenue,
      }))
      const ws3 = XLSX.utils.json_to_sheet(catRows)
      ws3['!cols'] = [{ wch: 22 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, ws3, 'Theo danh mục')
    }

    XLSX.writeFile(wb, `smartshop-baocao-${dateFrom}-${dateTo}.xlsx`)
    toast.success('Đã xuất báo cáo Excel thành công')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-full w-full flex-col p-6 lg:p-8">

      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="mb-1.5 flex items-center gap-1 text-xs text-gray-400">
            <span>Admin</span>
            <span className="text-gray-300">›</span>
            <span className="font-medium text-gray-500">Dashboard</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Tổng quan hệ thống
            </h1>
            {(loading || chartLoading) && (
              <span className="animate-pulse rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#c70039]">
                Đang đồng bộ…
              </span>
            )}
          </div>
        </div>
        <button
          className="flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#c70039] hover:text-[#c70039]"
          onClick={handleExport}
          type="button"
        >
          <FileSpreadsheet size={15} />
          Xuất Excel
        </button>
      </div>

      {/* KPI stat cards */}
      <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((stat) => <StatCard key={stat.id} stat={stat} />)}
      </section>

      {/* Chart filters */}
      <div className="mt-8">
        <ReportFilters
          preset={preset}
          dateFrom={dateFrom}
          dateTo={dateTo}
          groupBy={groupBy}
          categories={categories}
          category={category}
          brands={brands}
          brand={brand}
          onPreset={handlePreset}
          onDatesApply={handleDatesApply}
          onGroupByChange={setGroupBy}
          onCategoryChange={setCategory}
          onBrandChange={setBrand}
          onExportExcel={handleExport}
          onExportPdf={() => window.print()}
        />
      </div>

      {/* Revenue chart + category donut */}
      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
        <RevenueChart data={revenueData} groupBy={groupBy} periodLabel={periodLabel} />
        <CategoryRevenueChart data={visibleCategoryRevenue} totalLabel={categoryTotalLabel} />
      </section>

      {/* Recent orders + best-selling products */}
      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
        <RecentOrdersTable
          orders={recentOrders}
          onViewAll={() => navigate('/admin/orders')}
          onViewOrder={() => navigate('/admin/orders')}
        />
        <BestSellingProducts
          products={visibleTopProducts}
          onDetail={() => navigate('/admin/products')}
        />
      </section>

      {/* Top customers */}
      <div className="mt-8">
        <PotentialCustomers customers={topCustomers} onViewAll={() => navigate('/admin/users')} />
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 py-5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <span>© 2026 SmartShop Admin</span>
        <span className="text-emerald-500">System Status: Online</span>
      </footer>
    </div>
  )
}

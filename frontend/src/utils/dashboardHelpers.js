import { getImageUrl } from './image'

// ─── Number & currency ────────────────────────────────────────────────────────

export function safeNumber(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatCurrency(value) {
  return `${Math.round(safeNumber(value)).toLocaleString('vi-VN')}đ`
}

/** Compact: 1.500.000 → "2M", 750.000 → "750K", 500 → "500đ" */
export function compactMoney(value) {
  const amount = safeNumber(value)
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1).replace('.0', '')}B`
  if (amount >= 1_000_000) return `${Math.round(amount / 1_000_000).toLocaleString('vi-VN')}M`
  if (amount >= 1_000) return `${Math.round(amount / 1_000).toLocaleString('vi-VN')}K`
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`
}

// ─── Date ─────────────────────────────────────────────────────────────────────

export function parseDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function subtractDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

// ─── Customer ranking ─────────────────────────────────────────────────────────

export function customerRank(totalSpent) {
  const spent = safeNumber(totalSpent)
  if (spent >= 100_000_000) return 'Kim cương'
  if (spent >= 50_000_000) return 'Bạch kim'
  if (spent >= 20_000_000) return 'Vàng'
  return 'Bạc'
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang chuẩn bị hàng',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

const AVATAR_TONES = [
  'from-zinc-700 to-rose-300',
  'from-slate-900 to-sky-300',
  'from-rose-200 to-amber-100',
  'from-zinc-200 to-emerald-100',
  'from-emerald-900 to-sky-500',
]

const CHART_COLORS = ['#c70039', '#4249df', '#006b57', '#f59e0b', '#7c3aed', '#0ea5e9']

// ─── Revenue chart builder ────────────────────────────────────────────────────

function formatPeriodLabel(period, groupBy) {
  if (!period) return ''
  if (groupBy === 'month') {
    // '2024-06' → 'T6/24'
    const parts = period.split('-')
    if (parts.length >= 2) return `T${parseInt(parts[1])}/${parts[0].slice(2)}`
  }
  if (groupBy === 'week') {
    // '2024-W23' → 'T23'
    const wParts = period.split('-W')
    return wParts.length === 2 ? `T${wParts[1]}` : period
  }
  // day: '2024-06-01' → '01/06'
  const parts = period.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`
  return period
}

/** Chuyển dữ liệu grouped revenue từ API thành mảng cho BarChart (triệu đồng). */
export function buildGroupedRevenue(rows, groupBy) {
  return (rows || []).map((row) => ({
    period: formatPeriodLabel(row.period || '', groupBy),
    revenue: Number((safeNumber(row.revenue) / 1_000_000).toFixed(2)),
    ordersCount: safeNumber(row.ordersCount),
  }))
}

/** @deprecated dùng buildGroupedRevenue thay thế */
export function buildMonthlyRevenue(rows) {
  return buildGroupedRevenue(rows, 'month')
}

// ─── Category revenue chart builder ──────────────────────────────────────────

/**
 * Chuyển danh sách {category, revenue} thành dữ liệu pie chart.
 * Luôn hiện toàn bộ danh mục — không lọc theo category đã chọn để tránh 100% vô nghĩa.
 */
export function buildCategoryRevenue(rows) {
  const active = (rows || []).filter(row => safeNumber(row.revenue) > 0)
  const total = active.reduce((sum, row) => sum + safeNumber(row.revenue), 0)
  if (total <= 0) return []
  return active.map((row, i) => ({
    name: row.category || 'Khác',
    value: Math.round((safeNumber(row.revenue) / total) * 100),
    revenueLabel: compactMoney(safeNumber(row.revenue)),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))
}

// ─── Table / list builders ────────────────────────────────────────────────────

export function buildRecentOrders(orders) {
  return (orders || []).map((order, i) => ({
    rawId: order.id,
    id: `#ORD-${String(order.id).padStart(4, '0')}`,
    customer: order.receiverName || 'Khách lẻ',
    date: parseDate(order.createdDate)?.toLocaleDateString('vi-VN') || '',
    total: formatCurrency(order.totalPrice),
    status: ORDER_STATUS_LABELS[order.status] || order.status || 'Chờ xác nhận',
    avatarTone: AVATAR_TONES[i % AVATAR_TONES.length],
  }))
}

export function buildTopProducts(products) {
  return (products || []).map((product) => ({
    id: product.id,
    name: product.name || 'Sản phẩm',
    category: product.categoryName || 'Khác',
    brand: product.factory || product.sourceSite || 'SmartShop',
    price: compactMoney(product.price),
    sold: `${safeNumber(product.sold).toLocaleString('vi-VN')} đã bán`,
    image: product.image ? getImageUrl(product.image) : '',
  }))
}

export function buildPotentialCustomers(customers) {
  return (customers || []).map((c, i) => ({
    id: c.userId || c.email || i,
    name: c.fullName || c.email || 'Khách hàng',
    rank: customerRank(c.totalSpent),
    orders: `${safeNumber(c.orderCount).toLocaleString('vi-VN')} đơn hàng`,
    spending: formatCurrency(c.totalSpent),
    avatarTone: AVATAR_TONES[i % AVATAR_TONES.length],
  }))
}

// ─── Dashboard stat cards ─────────────────────────────────────────────────────

/**
 * Tạo 6 stat cards từ dữ liệu overview API.
 * - Doanh thu = deliveredRevenue (tiền thực nhận), note = tổng pipeline
 * - Tỷ lệ hoàn tất = COMPLETED / tổng đơn (không tính HỦY)
 */
export function buildDashboardStats(overview, topCustomers) {
  const status = overview.ordersByStatus || {}
  const totalOrders = safeNumber(overview.totalOrders)
  const completed = safeNumber(status.COMPLETED)
  const waiting = safeNumber(status.PENDING) + safeNumber(status.CONFIRMED) + safeNumber(status.PROCESSING)
  const todayOrders = safeNumber(overview.todayOrders)
  const completionRate = totalOrders > 0 ? ((completed / totalOrders) * 100).toFixed(1) : '0.0'

  return [
    {
      id: 'revenue',
      label: 'Doanh thu',
      value: compactMoney(overview.deliveredRevenue),
      note: `${compactMoney(overview.totalRevenue)} tổng đơn`,
      icon: 'receipt',
      tone: 'rose',
    },
    {
      id: 'orders',
      label: 'Đơn hàng',
      value: totalOrders.toLocaleString('vi-VN'),
      note: `${todayOrders} hôm nay`,
      icon: 'shoppingBag',
      tone: 'indigo',
    },
    {
      id: 'products',
      label: 'Sản phẩm',
      value: safeNumber(overview.totalProducts).toLocaleString('vi-VN'),
      note: `${safeNumber(overview.lowStockProducts)} sắp hết`,
      icon: 'archive',
      tone: 'teal',
    },
    {
      id: 'customers',
      label: 'Khách hàng',
      value: safeNumber(overview.totalUsers).toLocaleString('vi-VN'),
      note: `${topCustomers.length} nổi bật`,
      icon: 'userRound',
      tone: 'blue',
    },
    {
      id: 'pending',
      label: 'Chờ xử lý',
      value: waiting.toLocaleString('vi-VN'),
      note: '',
      icon: 'hourglass',
      tone: 'orange',
    },
    {
      id: 'completion',
      label: 'Tỷ lệ hoàn tất',
      value: `${completionRate}%`,
      note: '',
      icon: 'circleCheck',
      tone: 'green',
    },
  ]
}

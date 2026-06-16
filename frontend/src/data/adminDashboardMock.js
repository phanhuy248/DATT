/**
 * Dữ liệu mẫu cho Dashboard — chỉ dùng khi API không khả dụng.
 * Các giá trị phải đồng bộ format với buildDashboardStats() trong dashboardHelpers.js:
 *   - value: chuỗi đã format (VD: "462M", "33", "94.2%")
 *   - note: chuỗi mô tả ngắn
 */

// ─── Stat cards ───────────────────────────────────────────────────────────────

export const adminStats = [
  {
    id: 'revenue',
    label: 'Doanh thu',
    value: '75M',
    note: '462M tổng đơn',
    icon: 'receipt',
    tone: 'rose',
  },
  {
    id: 'orders',
    label: 'Đơn hàng',
    value: '33',
    note: '0 hôm nay',
    icon: 'shoppingBag',
    tone: 'indigo',
  },
  {
    id: 'products',
    label: 'Sản phẩm',
    value: '49',
    note: '4 sắp hết',
    icon: 'archive',
    tone: 'teal',
  },
  {
    id: 'customers',
    label: 'Khách hàng',
    value: '8',
    note: '4 nổi bật',
    icon: 'userRound',
    tone: 'blue',
  },
  {
    id: 'pending',
    label: 'Chờ xử lý',
    value: '25',
    note: '',
    icon: 'hourglass',
    tone: 'orange',
  },
  {
    id: 'completion',
    label: 'Tỷ lệ hoàn tất',
    value: '15.2%',
    note: '',
    icon: 'circleCheck',
    tone: 'green',
  },
]

// ─── Revenue chart (tháng, đơn vị triệu đồng) ────────────────────────────────

export const revenueByMonth = [
  { month: 'T1', current: 0, previous: 0 },
  { month: 'T2', current: 0, previous: 0 },
  { month: 'T3', current: 0, previous: 0 },
  { month: 'T4', current: 0, previous: 0 },
  { month: 'T5', current: 0, previous: 0 },
  { month: 'T6', current: 75, previous: 0 },
  { month: 'T7', current: 0, previous: 0 },
  { month: 'T8', current: 0, previous: 0 },
  { month: 'T9', current: 0, previous: 0 },
  { month: 'T10', current: 0, previous: 0 },
  { month: 'T11', current: 0, previous: 0 },
  { month: 'T12', current: 0, previous: 0 },
]

// ─── Category revenue (dùng value như revenue tương đối để vẽ tỷ lệ) ─────────

export const categoryRevenue = [
  { name: 'Laptop & PC', value: 45 },
  { name: 'Smartphones', value: 30 },
  { name: 'Phụ kiện', value: 15 },
  { name: 'Khác', value: 10 },
]

// ─── Recent orders ────────────────────────────────────────────────────────────

export const recentOrders = [
  {
    id: '#ORD-0001',
    customer: 'Phan Văn A',
    date: '07/06/2026',
    total: '35.000.000đ',
    status: 'Chờ xác nhận',
    avatarTone: 'from-slate-700 to-rose-500',
  },
  {
    id: '#ORD-0002',
    customer: 'Lê Thị B',
    date: '06/06/2026',
    total: '199.000đ',
    status: 'Đang giao',
    avatarTone: 'from-rose-300 to-orange-200',
  },
  {
    id: '#ORD-0003',
    customer: 'Nguyễn Văn C',
    date: '06/06/2026',
    total: '6.590.000đ',
    status: 'Hoàn tất',
    avatarTone: 'from-emerald-900 to-sky-500',
  },
]

// ─── Best selling products ────────────────────────────────────────────────────

export const bestSellingProducts = [
  {
    id: 1,
    name: 'MacBook Air M2',
    category: 'Laptop',
    brand: 'Apple',
    price: '35M',
    sold: '575 đã bán',
    image: '',
  },
  {
    id: 2,
    name: 'Realme XT Pro',
    category: 'Smartphone',
    brand: 'Realme',
    price: '9M',
    sold: '561 đã bán',
    image: '',
  },
  {
    id: 3,
    name: 'Sony WH-1000XM5',
    category: 'Audio',
    brand: 'Sony',
    price: '7M',
    sold: '342 đã bán',
    image: '',
  },
]

// ─── Potential customers ──────────────────────────────────────────────────────

export const potentialCustomers = [
  {
    id: 1,
    name: 'Lê Thu Thảo',
    rank: 'Kim cương',
    orders: '24 đơn hàng',
    spending: '152.000.000đ',
    avatarTone: 'from-zinc-700 to-rose-300',
  },
  {
    id: 2,
    name: 'Hoàng Nam',
    rank: 'Bạch kim',
    orders: '18 đơn hàng',
    spending: '98.500.000đ',
    avatarTone: 'from-slate-900 to-sky-300',
  },
  {
    id: 3,
    name: 'Phạm Minh Anh',
    rank: 'Vàng',
    orders: '15 đơn hàng',
    spending: '72.400.000đ',
    avatarTone: 'from-rose-200 to-amber-100',
  },
  {
    id: 4,
    name: 'Trần Quốc Cường',
    rank: 'Bạc',
    orders: '12 đơn hàng',
    spending: '45.200.000đ',
    avatarTone: 'from-zinc-200 to-emerald-100',
  },
]

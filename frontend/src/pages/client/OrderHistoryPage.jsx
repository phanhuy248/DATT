import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cancelMyOrder, getMyOrders } from '../../api/orders'
import OrderCard, { formatOrderCode } from '../../components/order/OrderCard'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'

const statusFilters = [
  { value: 'ALL', label: 'Tất cả', statuses: [] },
  { value: 'PROCESSING', label: 'Đang chuẩn bị hàng', statuses: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
  { value: 'SHIPPING', label: 'Đang giao hàng', statuses: ['SHIPPING'] },
  { value: 'COMPLETED', label: 'Hoàn thành', statuses: ['COMPLETED'] },
  { value: 'CANCELLED', label: 'Đã hủy', statuses: ['CANCELLED'] },
]

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'highest', label: 'Giá trị cao nhất' },
  { value: 'lowest', label: 'Giá trị thấp nhất' },
]

const defaultFilters = {
  query: '',
  status: 'ALL',
  fromDate: '',
  toDate: '',
  sort: 'newest',
}

export default function OrderHistoryPage() {
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  const [cancelError, setCancelError] = useState('')
  const [draftFilters, setDraftFilters] = useState(() => ({
    ...defaultFilters,
    query: searchParams.get('keyword') || '',
  }))
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    ...defaultFilters,
    query: searchParams.get('keyword') || '',
  }))

  useEffect(() => {
    let active = true
    getMyOrders()
      .then((data) => {
        if (!active) return
        setOrders(Array.isArray(data) ? data : data?.content || data?.items || [])
        setError('')
      })
      .catch(() => {
        if (!active) return
        setOrders([])
        setError('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const keyword = searchParams.get('keyword') || ''
    setDraftFilters((current) => ({ ...current, query: keyword }))
    setAppliedFilters((current) => ({ ...current, query: keyword }))
  }, [searchParams])

  const filteredOrders = useMemo(() => applyFilters(orders, appliedFilters), [orders, appliedFilters])

  async function handleCancelOrder(orderId) {
    setCancellingOrderId(orderId)
    setCancelError('')
    try {
      const updated = await cancelMyOrder(orderId)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
    } catch (err) {
      setCancelError(err?.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const applyDraftFilters = () => {
    setAppliedFilters(draftFilters)
    setDrawerOpen(false)
  }

  const resetFilters = () => {
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
  }

  return (
    <div className="bg-shop-bg">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="hidden lg:block">
          <OrderFilter filters={draftFilters} onApply={applyDraftFilters} onChange={setDraftFilters} onReset={resetFilters} />
        </aside>

        <main className="min-w-0">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <SectionHeader title="Lịch sử đơn hàng" subtitle={`${filteredOrders.length} đơn hàng`} />
            <Button type="button" variant="secondary" className="lg:hidden" onClick={() => setDrawerOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
              Bộ lọc
            </Button>
          </div>

          {error && <div className="mb-5 rounded-2xl border border-shop-error/20 bg-shop-error/10 px-5 py-4 text-sm font-bold text-shop-error">{error}</div>}
          {cancelError && <div className="mb-5 rounded-2xl border border-shop-error/20 bg-shop-error/10 px-5 py-4 text-sm font-bold text-shop-error">{cancelError}</div>}

          {loading ? (
            <OrderSkeletonList />
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-5">
              {filteredOrders.map((order) => {
                const key = order.id || formatOrderCode(order)
                return (
                  <OrderCard
                    key={key}
                    order={order}
                    expanded={expandedOrder === key}
                    onToggle={() => setExpandedOrder((current) => (current === key ? null : key))}
                    onCancel={handleCancelOrder}
                    cancelling={cancellingOrderId === order.id}
                  />
                )
              })}
            </div>
          ) : (
            <EmptyOrders onReset={resetFilters} />
          )}
        </main>
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button type="button" className="absolute inset-0 bg-shop-navy/50" aria-label="Đóng bộ lọc" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[min(88vw,340px)] overflow-y-auto bg-shop-surface p-4 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold text-shop-text">Bộ lọc</span>
              <Button variant="icon" onClick={() => setDrawerOpen(false)} aria-label="Đóng bộ lọc">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <OrderFilter filters={draftFilters} onApply={applyDraftFilters} onChange={setDraftFilters} onReset={resetFilters} />
          </aside>
        </div>
      )}
    </div>
  )
}

function OrderFilter({ filters, onChange, onApply, onReset }) {
  return (
    <div className="sticky top-24 rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-shop-red" />
        <h2 className="text-base font-bold text-shop-text">Bộ lọc đơn hàng</h2>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-shop-text">Mã đơn hoặc sản phẩm</span>
          <div className="flex h-11 items-center rounded-xl border border-shop-border bg-shop-bg px-3 transition focus-within:border-shop-red focus-within:bg-shop-surface focus-within:ring-4 focus-within:ring-shop-red/10">
            <Search className="mr-2 h-4 w-4 text-shop-muted" />
            <input
              value={filters.query}
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
              placeholder="Ví dụ: ORD-2026"
              className="w-full min-w-0 bg-transparent text-sm font-medium text-shop-text outline-none placeholder:text-shop-muted"
            />
          </div>
        </label>

        <div>
          <p className="mb-3 text-sm font-bold text-shop-text">Trạng thái</p>
          <div className="space-y-2">
            {statusFilters.map((item) => (
              <label key={item.value} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm font-bold text-shop-text transition hover:bg-shop-bg">
                <input
                  type="radio"
                  name="order-status"
                  value={item.value}
                  checked={filters.status === item.value}
                  onChange={() => onChange({ ...filters, status: item.value })}
                  className="h-4 w-4 accent-shop-red"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-shop-text">Khoảng thời gian</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={filters.fromDate} onChange={(event) => onChange({ ...filters, fromDate: event.target.value })} className="form-control" />
            <input type="date" value={filters.toDate} onChange={(event) => onChange({ ...filters, toDate: event.target.value })} className="form-control" />
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-shop-text">Sắp xếp</span>
          <select value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value })} className="form-control">
            {sortOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <Button type="button" className="w-full" onClick={onApply}>
          Áp dụng bộ lọc
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={onReset}>
          Xóa bộ lọc
        </Button>
      </div>
    </div>
  )
}

function OrderSkeletonList() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse overflow-hidden rounded-2xl border border-shop-border bg-shop-surface shadow-sm">
          <div className="flex items-center justify-between p-6">
            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-shop-softBlue" />
              <div className="h-6 w-52 rounded bg-shop-softBlue" />
            </div>
            <div className="h-9 w-28 rounded-full bg-shop-softBlue" />
          </div>
          <div className="border-y border-shop-border p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-24 rounded-xl bg-shop-softBlue" />
              <div className="h-24 rounded-xl bg-shop-softBlue" />
            </div>
          </div>
          <div className="h-20 bg-shop-softBlue" />
        </div>
      ))}
    </div>
  )
}

function EmptyOrders({ onReset }) {
  return (
    <div className="rounded-2xl border border-shop-border bg-shop-surface px-6 py-14 text-center shadow-sm">
      <h2 className="text-xl font-bold text-shop-text">Không tìm thấy đơn hàng</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-shop-muted">
        Thử đổi trạng thái, khoảng thời gian hoặc mã đơn hàng để xem lại lịch sử mua sắm.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="secondary" onClick={onReset}>
          Xóa bộ lọc
        </Button>
        <Button to="/products">Tiếp tục mua sắm</Button>
      </div>
    </div>
  )
}

function applyFilters(orders, filters) {
  const query = normalizeText(filters.query)
  const selected = statusFilters.find((item) => item.value === filters.status)

  return [...orders]
    .filter((order) => {
      const created = toDate(order.createdDate)
      const orderCode = normalizeText(formatOrderCode(order))
      const products = normalizeText((order.items || []).map((item) => item.productName).join(' '))

      if (query && !orderCode.includes(query) && !String(order.id || '').includes(query) && !products.includes(query)) return false
      if (selected?.statuses.length > 0 && !selected.statuses.includes(order.status)) return false
      if (filters.fromDate && created && created < new Date(`${filters.fromDate}T00:00:00`)) return false
      if (filters.toDate && created && created > new Date(`${filters.toDate}T23:59:59`)) return false
      return true
    })
    .sort((a, b) => {
      if (filters.sort === 'oldest') return Number(toDate(a.createdDate)) - Number(toDate(b.createdDate))
      if (filters.sort === 'highest') return Number(b.totalPrice || 0) - Number(a.totalPrice || 0)
      if (filters.sort === 'lowest') return Number(a.totalPrice || 0) - Number(b.totalPrice || 0)
      return Number(toDate(b.createdDate)) - Number(toDate(a.createdDate))
    })
}

function toDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

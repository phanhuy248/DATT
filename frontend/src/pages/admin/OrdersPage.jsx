import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CreditCard,
  FileSpreadsheet,
  Search,
  Truck,
  User,
  X,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { getAllOrders, updateOrderStatus } from '../../api/orders'
import { getImageUrl } from '../../utils/image'
import {
  Badge,
  Button,
  Card,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_VARIANT,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_VARIANT,
  PageHeader,
  Pagination,
} from '../../components/admin/ui'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED']

const PAYMENT_METHOD_LABEL = {
  COD:           'COD',
  BANK_TRANSFER: 'Chuyển khoản QR',
  VNPAY:         'VNPAY',
  MOMO:          'MoMo',
}

const PAGE_SIZE = 10

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const expandHandled = useRef(false)
  const filterHandled = useRef(false)

  const [data,         setData]         = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading,      setLoading]      = useState(true)
  const [page,         setPage]         = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUserId, setFilterUserId] = useState(location.state?.filterUserId ?? null)
  const [filterUserName, setFilterUserName] = useState(location.state?.filterUserName ?? '')
  const [filterUserEmail, setFilterUserEmail] = useState(location.state?.filterUserEmail ?? '')
  const [searchInput,  setSearchInput]  = useState('')
  const [search,       setSearch]       = useState('')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [expanded,       setExpanded]       = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(new Set())
  const [pendingStatus,  setPendingStatus]  = useState({})

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = useCallback(() => {
    setLoading(true)
    const params = {
      page,
      size: PAGE_SIZE,
      ...(filterStatus  && { status: filterStatus }),
      ...(filterUserId  && { userId: filterUserId }),
      ...(search        && { search }),
      ...(dateFrom      && { dateFrom }),
      ...(dateTo        && { dateTo }),
    }
    getAllOrders(params).then(setData).finally(() => setLoading(false))
  }, [page, filterStatus, filterUserId, search, dateFrom, dateTo])

  const clearUserFilter = () => {
    setFilterUserId(null)
    setFilterUserName('')
    setFilterUserEmail('')
    setPage(0)
    navigate('/admin/orders', { replace: true, state: {} })
  }

  useEffect(() => { load() }, [load])

  // Auto-expand order navigated from dashboard
  useEffect(() => {
    const expandId = location.state?.expandOrderId
    if (!expandId || expandHandled.current || loading) return
    const orders = data.content || []
    if (orders.length === 0) return
    const found = orders.find((o) => o.id === expandId)
    if (found) {
      setExpanded(expandId)
      expandHandled.current = true
    }
  }, [data.content, loading, location.state])

  // Auto-apply status filter navigated from dashboard stat card
  useEffect(() => {
    const applyStatus = location.state?.applyStatus
    if (!applyStatus || filterHandled.current) return
    filterHandled.current = true
    setFilterStatus(applyStatus)
    setPage(0)
  }, [location.state])

  const handleStatusChange = async (orderId, status, note = '') => {
    setStatusUpdating(prev => new Set(prev).add(orderId))
    try {
      await updateOrderStatus(orderId, status, note)
      toast.success('Lưu thay đổi thành công!')
      setPendingStatus(prev => { const n = { ...prev }; delete n[orderId]; return n })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu thay đổi')
    } finally {
      setStatusUpdating(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const orders = data.content || []
  const totalPages    = data.totalPages    || 0
  const totalElements = data.totalElements || 0

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Quản lý đơn hàng"
        breadcrumb={[{ label: 'Admin' }, { label: 'Đơn hàng' }]}
        actions={
          <Button variant="secondary" onClick={() => exportOrdersToExcel(orders)}>
            <FileSpreadsheet size={15} className="text-green-600" />
            Xuất Excel
          </Button>
        }
      />

      {/* User filter banner */}
      {filterUserId && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <User size={15} className="shrink-0 text-blue-500" />
            <div>
              <p className="text-xs font-semibold text-blue-800">{filterUserName || 'Người dùng'}</p>
              <p className="text-[11px] text-blue-500">{filterUserEmail} · {data.totalElements} đơn hàng · Tổng: {data.content.reduce((s, o) => s + (o.totalPrice || 0), 0).toLocaleString('vi-VN')}₫</p>
            </div>
          </div>
          <button onClick={clearUserFilter} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors">
            <X size={13} /> Bỏ lọc
          </button>
        </div>
      )}

      {/* Filter card */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D70018]/30"
            />
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); setExpanded(null) }}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D70018]/30"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-600">
            <Calendar size={14} className="shrink-0 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0) }}
              className="border-none bg-transparent text-sm outline-none"
            />
            <span className="text-gray-300">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0) }}
              className="border-none bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Table card */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#D70018]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  {['Mã', 'Người nhận', 'SĐT', 'Tổng tiền', 'Thanh toán', 'TT thanh toán', 'Trạng thái'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                      Không có đơn hàng nào
                    </td>
                  </tr>
                ) : orders.map((o) => {
                  const isExpanded = expanded === o.id
                  return (
                    <React.Fragment key={o.id}>
                      <tr
                        onClick={() => setExpanded(isExpanded ? null : o.id)}
                        className={`cursor-pointer border-b border-gray-100 transition-colors ${isExpanded ? 'bg-rose-50/40' : 'hover:bg-gray-50/80'}`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#c70039]">#{o.id}</span>
                            {isExpanded ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-900">{o.receiverName}</td>
                        <td className="px-4 py-3.5 text-gray-500">{o.receiverPhone}</td>
                        <td className="px-4 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                          {o.totalPrice?.toLocaleString('vi-VN')}₫
                        </td>
                        <td className="px-4 py-3.5 text-gray-500">
                          {PAYMENT_METHOD_LABEL[o.paymentMethod] || o.paymentMethod || 'COD'}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={PAYMENT_STATUS_VARIANT[o.paymentStatus] || 'gray'}>
                            {PAYMENT_STATUS_LABEL[o.paymentStatus] || o.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={ORDER_STATUS_VARIANT[o.status] || 'gray'}>
                            {ORDER_STATUS_LABEL[o.status] || o.status}
                          </Badge>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="border-b border-gray-100">
                          <td colSpan={7} className="px-0 py-0">
                            <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-5">

                              {/* ── Header ── */}
                              <div className="mb-5 flex items-center justify-between">
                                <div>
                                  <div className="mb-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                                    <span>Admin</span>
                                    <ChevronRight size={9} />
                                    <span>Đơn hàng</span>
                                    <ChevronRight size={9} />
                                    <span>Chi tiết</span>
                                  </div>
                                  <h3 className="text-sm font-bold text-gray-800">Chi tiết đơn hàng #{o.id}</h3>
                                </div>
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => exportOrderToExcel(o)}
                                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
                                  >
                                    <FileSpreadsheet size={13} className="text-green-600" />
                                    Xuất Excel
                                  </button>
                                  {o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && (
                                    <button
                                      disabled={statusUpdating.has(o.id)}
                                      onClick={() => handleStatusChange(
                                        o.id,
                                        pendingStatus[o.id] ?? o.status
                                      )}
                                      className="flex items-center gap-1.5 rounded-lg bg-[#D70018] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#b5001a] transition-colors disabled:cursor-wait disabled:opacity-60"
                                    >
                                      {statusUpdating.has(o.id) ? 'Đang lưu…' : 'Lưu thay đổi'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* ── 3 Info Cards ── */}
                              <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">

                                {/* Card 1: Customer */}
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                  <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                                    <User size={12} className="text-gray-400" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Thông tin khách hàng</span>
                                  </div>
                                  <div className="space-y-2">
                                    <DetailRow label="Địa chỉ nhận" value={o.receiverAddress || '—'} />
                                    <DetailRow
                                      label="Nội dung CK"
                                      value={o.paymentMethod === 'BANK_TRANSFER' ? `DH${o.id}` : '—'}
                                    />
                                    <DetailRow label="Mã giao dịch" value={o.transactionCode || '—'} highlight />
                                    <DetailRow
                                      label="Ngày đặt"
                                      value={o.createdDate ? new Date(o.createdDate).toLocaleString('vi-VN') : '—'}
                                    />
                                  </div>
                                  <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="mb-0.5 text-[10px] text-gray-400">Số điện thoại đặt hàng</p>
                                    <p className="text-xs font-bold text-gray-800">{o.receiverPhone || '—'}</p>
                                  </div>
                                </div>

                                {/* Card 2: Payment */}
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                  <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                                    <CreditCard size={12} className="text-gray-400" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Thanh toán</span>
                                  </div>
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] text-gray-400">Phương thức</span>
                                      <span className="text-[11px] font-bold text-gray-800">
                                        {PAYMENT_METHOD_LABEL[o.paymentMethod] || o.paymentMethod || 'COD'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] text-gray-400">Trạng thái</span>
                                      <Badge variant={PAYMENT_STATUS_VARIANT[o.paymentStatus] || 'gray'}>
                                        {PAYMENT_STATUS_LABEL[o.paymentStatus] || o.paymentStatus}
                                      </Badge>
                                    </div>
                                    <DetailRow label="Mã giao dịch" value={o.transactionCode || '—'} />
                                  </div>
                                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                                    <span className="text-xs font-semibold text-gray-500">Tổng tiền</span>
                                    <span className="text-sm font-bold text-[#D70018]">
                                      {o.totalPrice?.toLocaleString('vi-VN')}₫
                                    </span>
                                  </div>
                                </div>

                                {/* Card 3: Order Progress */}
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                  <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                                    <Truck size={12} className="text-gray-400" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tiến độ đơn hàng</span>
                                  </div>
                                  <div className="space-y-2.5">
                                    <DetailRow
                                      label="Ngày đặt"
                                      value={o.createdDate ? new Date(o.createdDate).toLocaleString('vi-VN') : '—'}
                                    />
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] text-gray-400">Trạng thái hiện tại</span>
                                      <Badge variant={ORDER_STATUS_VARIANT[o.status] || 'gray'}>
                                        {ORDER_STATUS_LABEL[o.status] || o.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="mt-3 border-t border-gray-100 pt-2.5" onClick={(e) => e.stopPropagation()}>
                                    <p className="mb-1.5 text-[11px] font-semibold text-gray-500">Đổi trạng thái:</p>
                                    {(o.status === 'COMPLETED' || o.status === 'CANCELLED') ? (
                                      <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${o.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                        <span>{o.status === 'COMPLETED' ? '✓ Đơn hàng đã hoàn thành' : '✕ Đơn hàng đã hủy'}</span>
                                      </div>
                                    ) : (
                                      <select
                                        value={pendingStatus[o.id] ?? o.status}
                                        disabled={statusUpdating.has(o.id)}
                                        onChange={(e) => setPendingStatus(prev => ({ ...prev, [o.id]: e.target.value }))}
                                        className="h-8 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D70018]/30 disabled:cursor-wait disabled:opacity-50"
                                      >
                                        {STATUS_OPTIONS.map((s) => (
                                          <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* ── Products Table ── */}
                              {(o.items || []).length > 0 && (
                                <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                    <span className="text-xs font-semibold text-[#D70018]">Danh sách sản phẩm</span>
                                    <span className="text-[11px] text-gray-400">{(o.items || []).length} Sản phẩm</span>
                                  </div>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-100 bg-gray-50/60">
                                        <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Sản phẩm</th>
                                        <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">Số lượng</th>
                                        <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">Đơn giá</th>
                                        <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">Thành tiền</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {o.items.map((item, i) => (
                                        <tr key={i} className="border-b border-gray-50 last:border-0">
                                          <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                              {getImageUrl(item.productImage) && (
                                                <img
                                                  src={getImageUrl(item.productImage)}
                                                  alt={item.productName}
                                                  className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 object-cover"
                                                />
                                              )}
                                              <span className="font-medium leading-snug text-gray-800">{item.productName}</span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-center text-gray-500">{item.quantity}</td>
                                          <td className="px-4 py-3 text-right text-gray-500">{item.price?.toLocaleString('vi-VN')}₫</td>
                                          <td className="px-4 py-3 text-right font-bold text-gray-800">
                                            {(item.price * item.quantity)?.toLocaleString('vi-VN')}₫
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <div className="border-t border-gray-100 px-4 py-3">
                                    <div className="ml-auto w-56 space-y-1.5">
                                      <div className="flex justify-between text-[11px] text-gray-500">
                                        <span>Tạm tính:</span>
                                        <span>{o.totalPrice?.toLocaleString('vi-VN')}₫</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] text-gray-500">
                                        <span>Phí vận chuyển:</span>
                                        <span>0₫</span>
                                      </div>
                                      {o.discountAmount > 0 && (
                                        <div className="flex justify-between text-[11px] text-green-600">
                                          <span>Giảm giá:</span>
                                          <span>-{o.discountAmount?.toLocaleString('vi-VN')}₫</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold">
                                        <span className="text-gray-700">Tổng thanh toán:</span>
                                        <span className="text-[#D70018]">{o.totalPrice?.toLocaleString('vi-VN')}₫</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* ── History ── */}
                              <div
                                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="mb-3 text-[11px] font-semibold text-gray-500">Lịch sử đơn hàng</p>
                                <OrderStatusTimeline status={o.status} createdDate={o.createdDate} />
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={totalElements}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </Card>
    </div>
  )
}

function exportOrderToExcel(order) {
  const wb = XLSX.utils.book_new()
  const infoRows = [
    ['Mã đơn hàng',    '#' + order.id],
    ['Người nhận',     order.receiverName || ''],
    ['Số điện thoại',  order.receiverPhone || ''],
    ['Địa chỉ nhận',   order.receiverAddress || ''],
    ['Phương thức TT', PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod || ''],
    ['Trạng thái TT',  PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus || ''],
    ['Trạng thái đơn', ORDER_STATUS_LABEL[order.status] || order.status || ''],
    ['Ngày đặt',       order.createdDate ? new Date(order.createdDate).toLocaleString('vi-VN') : ''],
    ['Mã giao dịch',   order.transactionCode || ''],
    ['Tổng tiền (đ)',   order.totalPrice ?? 0],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(infoRows), 'Thông tin')

  if (order.items?.length) {
    const rows = [
      ['Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'],
      ...order.items.map(item => [
        item.productName,
        item.quantity,
        item.price,
        item.price * item.quantity,
      ]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Sản phẩm')
  }
  XLSX.writeFile(wb, `don-hang-${order.id}.xlsx`)
}

function exportOrdersToExcel(orders) {
  const wb = XLSX.utils.book_new()
  const rows = [
    ['Mã', 'Người nhận', 'SĐT', 'Địa chỉ', 'Thanh toán', 'TT thanh toán', 'Trạng thái', 'Ngày đặt', 'Tổng tiền (đ)'],
    ...orders.map(o => [
      '#' + o.id,
      o.receiverName || '',
      o.receiverPhone || '',
      o.receiverAddress || '',
      PAYMENT_METHOD_LABEL[o.paymentMethod] || o.paymentMethod || '',
      PAYMENT_STATUS_LABEL[o.paymentStatus] || o.paymentStatus || '',
      ORDER_STATUS_LABEL[o.status] || o.status || '',
      o.createdDate ? new Date(o.createdDate).toLocaleString('vi-VN') : '',
      o.totalPrice ?? 0,
    ]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Đơn hàng')
  XLSX.writeFile(wb, 'danh-sach-don-hang.xlsx')
}

function DetailRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-[11px] text-gray-400">{label}</span>
      <span className={`truncate text-right text-[11px] font-semibold ${highlight ? 'text-[#c70039]' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
}

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED']
const STATUS_HISTORY_LABEL = {
  PENDING:    'Đơn hàng được khởi tạo',
  CONFIRMED:  'Đã xác nhận đơn hàng',
  PROCESSING: 'Đang xử lý đơn hàng',
  SHIPPING:   'Đang giao hàng',
  COMPLETED:  'Giao hàng thành công',
  CANCELLED:  'Đã hủy đơn hàng',
}

function OrderStatusTimeline({ status, createdDate }) {
  const isCancelled = status === 'CANCELLED'
  const currentIdx  = STATUS_FLOW.indexOf(status)

  const events = []
  if (isCancelled) {
    events.push({ label: STATUS_HISTORY_LABEL.CANCELLED, dot: 'red' })
  }
  const reachedIdx = isCancelled ? 0 : currentIdx
  for (let i = reachedIdx; i >= 0; i--) {
    events.push({
      label: STATUS_HISTORY_LABEL[STATUS_FLOW[i]],
      date:  i === 0 ? createdDate : null,
      dot:   i === reachedIdx && !isCancelled ? 'green' : i === 0 ? 'gray' : 'blue',
    })
  }

  return (
    <div className="space-y-3">
      {events.map((e, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
            e.dot === 'green' ? 'bg-green-500' :
            e.dot === 'blue'  ? 'bg-blue-500'  :
            e.dot === 'red'   ? 'bg-red-500'   : 'bg-gray-300'
          }`} />
          <div>
            <p className="text-[11px] font-medium text-gray-700">{e.label}</p>
            {e.date && (
              <p className="text-[10px] text-gray-400">
                {new Date(e.date).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

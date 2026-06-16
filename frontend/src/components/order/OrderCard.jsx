import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock3, CreditCard, Eye, Loader2, MapPin, Package, RotateCcw, Truck, User, X } from 'lucide-react'
import Button from '../ui/Button'
import { getImageUrl } from '../../utils/image'

const moneyFormatter = new Intl.NumberFormat('vi-VN')
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const statusMeta = {
  PENDING: { label: 'Đang xử lý', icon: Clock3, badge: 'bg-shop-warning/10 text-shop-warning', percent: 20 },
  CONFIRMED: { label: 'Đã xác nhận', icon: CheckCircle2, badge: 'bg-shop-softBlue text-shop-navy', percent: 38 },
  PROCESSING: { label: 'Đang chuẩn bị hàng', icon: Package, badge: 'bg-shop-softBlue text-shop-navy', percent: 55 },
  SHIPPING: { label: 'Đang giao hàng', icon: Truck, badge: 'bg-shop-softBlue text-shop-navy', percent: 76 },
  COMPLETED: { label: 'Hoàn thành', icon: CheckCircle2, badge: 'bg-shop-success/10 text-shop-success', percent: 100 },
  CANCELLED: { label: 'Đã hủy', icon: RotateCcw, badge: 'bg-shop-error/10 text-shop-error', percent: 100 },
}

const paymentLabels = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  CANCELLED: 'Đã hủy thanh toán',
  REFUNDED: 'Đã hoàn tiền',
}

export function formatOrderCode(order) {
  const created = toDate(order?.createdDate)
  const year = created?.getFullYear() || new Date().getFullYear()
  return `#ORD-${year}-${String(order?.id || 0).padStart(3, '0')}`
}

export default function OrderCard({ order, expanded = false, onToggle, onCancel, cancelling = false }) {
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelInitiated, setCancelInitiated] = useState(false)
  const meta = statusMeta[order?.status] || statusMeta.PENDING
  const StatusIcon = meta.icon
  const createdDate = toDate(order?.createdDate)
  const items = Array.isArray(order?.items) ? order.items : []
  const total = Number(order?.totalPrice || 0)
  const showTracking = order?.status !== 'CANCELLED'
  const cancellable = order?.status === 'PENDING' && order?.paymentStatus !== 'PAID'
  const needsPayment = order?.status === 'PENDING'
    && order?.paymentMethod !== 'COD'
    && ['PENDING', 'CANCELLED', 'FAILED'].includes(order?.paymentStatus)

  function handleCancelClick() {
    setConfirmingCancel(true)
  }

  function handleConfirmCancel() {
    setConfirmingCancel(false)
    setCancelInitiated(true)
    onCancel?.(order.id)
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-shop-border bg-shop-surface shadow-sm transition duration-200 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-5 p-5 lg:p-6">
        <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(150px,1fr)_1px_minmax(130px,1fr)] sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-shop-muted">Mã đơn hàng</p>
            <p className="mt-1 text-xl font-bold leading-tight text-shop-text">{formatOrderCode(order)}</p>
          </div>
          <span className="hidden h-10 w-px bg-shop-border sm:block" />
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-shop-muted">
              <CalendarDays className="h-3.5 w-3.5" />
              Ngày đặt
            </p>
            <p className="mt-1 text-sm font-bold text-shop-text">{createdDate ? dateFormatter.format(createdDate) : '--'}</p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${meta.badge}`}>
          <StatusIcon className="h-4 w-4" />
          {meta.label}
        </span>
      </div>

      <div className="border-y border-shop-border p-5 lg:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.slice(0, 3).map((item, index) => (
            <OrderProductPreview key={`${order?.id}-${item.productId}-${index}`} item={item} />
          ))}
          {items.length > 3 && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-shop-border bg-shop-bg px-4 py-4 text-sm font-bold text-shop-muted">
              +{items.length - 3} sản phẩm khác
            </div>
          )}
        </div>

        {showTracking && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-shop-muted">
              <span>Tiến trình xử lý</span>
              <span>{meta.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-shop-softBlue">
              <div className="h-full rounded-full bg-shop-red" style={{ width: `${meta.percent}%` }} />
            </div>
          </div>
        )}

        {expanded && (
          <div className="mt-6 grid gap-4 rounded-2xl border border-shop-border bg-shop-bg p-4 text-sm sm:grid-cols-2">
            <InfoRow icon={User} label="Người nhận" value={order?.receiverName || 'Chưa cập nhật'} />
            <InfoRow icon={Package} label="Thanh toán" value={paymentLabels[order?.paymentStatus] || order?.paymentStatus || order?.paymentMethod || 'COD'} />
            <InfoRow icon={MapPin} label="Địa chỉ giao hàng" value={order?.receiverAddress || 'Chưa cập nhật'} wide />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 bg-shop-softBlue p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
        <div>
          <p className="text-sm font-medium text-shop-muted">Tổng thanh toán</p>
          <p className="mt-1 text-2xl font-bold leading-none text-shop-red">{moneyFormatter.format(total)}đ</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {cancellable && !confirmingCancel && (
            <Button onClick={handleCancelClick} variant="secondary" disabled={cancelling || cancelInitiated}
              className="border-shop-error/40 text-shop-error hover:border-shop-error hover:text-shop-error">
              {(cancelling || cancelInitiated) ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              {(cancelling || cancelInitiated) ? 'Đang hủy…' : 'Hủy đơn'}
            </Button>
          )}

          {confirmingCancel && (
            <div className="flex items-center gap-2 rounded-xl border border-shop-error/40 bg-shop-error/5 px-3 py-1.5">
              <span className="text-xs font-bold text-shop-error">Xác nhận hủy đơn?</span>
              <button type="button" onClick={handleConfirmCancel}
                className="rounded-lg bg-shop-error px-2.5 py-1 text-xs font-bold text-white transition hover:opacity-80">
                Có
              </button>
              <button type="button" onClick={() => setConfirmingCancel(false)}
                className="rounded-lg border border-shop-border px-2.5 py-1 text-xs font-bold text-shop-text transition hover:bg-shop-softBlue">
                Không
              </button>
            </div>
          )}

          {needsPayment && (
            <Button to={`/orders/${order.id}/payment`} variant="primary">
              <CreditCard className="h-4 w-4" />
              Tiếp tục thanh toán
            </Button>
          )}

          <Button onClick={onToggle} variant={needsPayment ? 'secondary' : 'primary'}>
            <Eye className="h-4 w-4" />
            {expanded ? 'Thu gọn' : 'Chi tiết'}
          </Button>
        </div>
      </div>
    </article>
  )
}

function OrderProductPreview({ item }) {
  const imageUrl = getImageUrl(item?.productImage)
  const total = Number(item?.price || 0) * Number(item?.quantity || 1)

  return (
    <Link to={item?.productId ? `/products/${item.productId}` : '/products'} className="group flex min-w-0 items-center gap-4 rounded-xl border border-shop-border bg-shop-bg p-3 transition hover:border-shop-red hover:bg-shop-surface">
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-shop-surface">
        {imageUrl ? (
          <img src={imageUrl} alt={item?.productName || 'Sản phẩm'} className="h-full w-full object-contain p-1.5" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-shop-muted">
            <Package className="h-7 w-7" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-bold leading-5 text-shop-text">{item?.productName || 'Sản phẩm'}</h3>
        <p className="mt-1 text-xs font-medium text-shop-muted">Số lượng: {item?.quantity || 1}</p>
        <p className="mt-1 text-sm font-bold text-shop-red">{moneyFormatter.format(total)}đ</p>
      </div>
    </Link>
  )
}

function InfoRow({ icon: Icon, label, value, wide }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-shop-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="font-bold leading-6 text-shop-text">{value}</p>
    </div>
  )
}

function toDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

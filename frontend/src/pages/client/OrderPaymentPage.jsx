import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Ban, Building2, Clock, CreditCard, QrCode, RefreshCw, Wallet } from 'lucide-react'
import { toast } from 'react-toastify'
import { cancelMyOrder, changePaymentMethod, getMyOrder } from '../../api/orders'
import { createVnpayPayment } from '../../api/payments'
import Button from '../../components/ui/Button'

const PAYMENT_EXPIRE_MS = 5 * 60 * 1000 // 5 phút

const PAYMENT_LABELS = {
  UNPAID:    'Chưa thanh toán',
  PENDING:   'Chờ xác nhận',
  SUCCESS:   'Đã thanh toán',
  FAILED:    'Thanh toán thất bại',
  CANCELLED: 'Đã hủy thanh toán',
  REFUNDED:  'Đã hoàn tiền',
}

const METHOD_LABELS = {
  COD:           'Thanh toán khi nhận hàng',
  VNPAY:         'VNPAY',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

const AVAILABLE_METHODS = [
  { value: 'VNPAY',         label: 'VNPAY',                           Icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng',          Icon: Building2 },
  { value: 'COD',           label: 'Thanh toán khi nhận hàng (COD)',  Icon: Wallet },
]

/** Hook đếm ngược từ createdDate + 5 phút */
function useCountdown(createdDate) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!createdDate) return
    const expireAt = new Date(createdDate).getTime() + PAYMENT_EXPIRE_MS

    const tick = () => {
      const diff = expireAt - Date.now()
      setRemaining(Math.max(0, diff))
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [createdDate])

  return remaining
}

function formatCountdown(ms) {
  if (ms == null) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function OrderPaymentPage() {
  const { id: orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showMethodPicker, setShowMethodPicker] = useState(false)
  const [changingMethod, setChangingMethod] = useState(false)
  const pollRef = useRef(null)

  const remaining = useCountdown(order?.createdDate)
  const isExpired = remaining === 0

  const fetchOrder = () => {
    setLoading(true)
    getMyOrder(orderId)
      .then(setOrder)
      .catch(() => toast.error('Không thể tải thông tin đơn hàng'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  // Poll để nhận kết quả thanh toán — dừng khi trạng thái đóng
  useEffect(() => {
    if (!order) return
    const closed = ['SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(order.paymentStatus)
      || order.status === 'CANCELLED'
    if (closed) {
      clearInterval(pollRef.current)
      return
    }
    if (order.status === 'PENDING_PAYMENT') {
      pollRef.current = setInterval(async () => {
        try {
          const updated = await getMyOrder(orderId)
          setOrder(updated)
          if (updated.paymentStatus === 'SUCCESS') {
            clearInterval(pollRef.current)
            navigate(`/order-success/${orderId}`, { replace: true })
          } else if (updated.status === 'CANCELLED') {
            clearInterval(pollRef.current)
          }
        } catch { /* bỏ qua lỗi mạng tạm thời */ }
      }, 5000)
    }
    return () => clearInterval(pollRef.current)
  }, [order?.status, order?.paymentStatus, orderId, navigate])

  // Redirect khi thanh toán thành công
  useEffect(() => {
    if (order?.paymentStatus === 'SUCCESS') {
      navigate(`/order-success/${orderId}`, { replace: true })
    }
  }, [order, orderId, navigate])

  const handleVnpayPayment = async () => {
    setPaying(true)
    try {
      const result = await createVnpayPayment(orderId)
      window.location.href = result.paymentUrl
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo link thanh toán VNPAY')
      setPaying(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return
    setCancelling(true)
    try {
      await cancelMyOrder(orderId)
      toast.success('Đã hủy đơn hàng')
      navigate('/orders')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng')
    } finally {
      setCancelling(false)
    }
  }

  const handleChangeMethod = async (newMethod) => {
    if (newMethod === order?.paymentMethod) { setShowMethodPicker(false); return }
    setChangingMethod(true)
    try {
      const updated = await changePaymentMethod(orderId, newMethod)
      setOrder(updated)
      setShowMethodPicker(false)
      if (newMethod === 'COD') {
        toast.success('Đã đổi sang thanh toán khi nhận hàng.')
        navigate('/orders')
      } else {
        toast.success('Đã đổi phương thức thanh toán')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đổi phương thức thanh toán')
    } finally {
      setChangingMethod(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="spinner mx-auto" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-shop-muted">Không tìm thấy đơn hàng.</p>
        <Button to="/orders" variant="secondary" className="mt-4">
          <ArrowLeft className="h-4 w-4" /> Về đơn hàng của tôi
        </Button>
      </div>
    )
  }

  // ── Trạng thái đã hủy ────────────────────────────────────────────────────
  if (order.status === 'CANCELLED') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-5">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-shop-error/10 text-shop-error">
            <Ban className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-shop-text">🔴 Đơn hàng đã hủy</h1>
          <p className="mt-2 text-sm text-shop-muted">
            {order.cancelReason || 'Đơn hàng đã hết hạn thanh toán hoặc bị hủy.'}
          </p>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button to="/orders" variant="secondary"><ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi</Button>
          <Button to="/products">Tiếp tục mua sắm</Button>
        </div>
      </div>
    )
  }

  const isPendingPayment = order.status === 'PENDING_PAYMENT'
  const isPaymentFailed  = order.paymentStatus === 'FAILED'
  const isPaymentCancelled = order.paymentStatus === 'CANCELLED'
  const canRetry = isPendingPayment
    && !isExpired
    && order.status !== 'CANCELLED'
    && order.paymentStatus !== 'SUCCESS'
  const canCancel = ['PENDING_PAYMENT', 'PENDING'].includes(order.status)
    && order.paymentStatus !== 'SUCCESS'
    && !isExpired

  let StatusIcon, iconBg, statusTitle, statusDesc
  if (isExpired && isPendingPayment) {
    StatusIcon = Ban; iconBg = 'bg-shop-error/10 text-shop-error'
    statusTitle = '🔴 Hết hạn thanh toán'
    statusDesc = 'Đơn hàng đã hết thời gian thanh toán. Hệ thống sẽ tự động hủy.'
  } else if (isPaymentFailed) {
    StatusIcon = AlertCircle; iconBg = 'bg-shop-error/10 text-shop-error'
    statusTitle = 'Thanh toán thất bại'
    statusDesc = 'Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức khác.'
  } else if (isPaymentCancelled) {
    StatusIcon = AlertCircle; iconBg = 'bg-yellow-100 text-yellow-600'
    statusTitle = 'Đã hủy thanh toán'
    statusDesc = 'Bạn đã hủy giao dịch. Có thể thử lại hoặc chọn phương thức khác.'
  } else if (isPendingPayment && order.paymentMethod === 'BANK_TRANSFER') {
    StatusIcon = Clock; iconBg = 'bg-shop-success/10 text-shop-success'
    statusTitle = '🟠 Chờ thanh toán'
    statusDesc = 'Vui lòng chuyển khoản theo thông tin bên dưới. Hệ thống tự xác nhận qua SePay.'
  } else if (isPendingPayment) {
    StatusIcon = Clock; iconBg = 'bg-orange-100 text-orange-600'
    statusTitle = '🟠 Chờ thanh toán'
    statusDesc = 'Đơn hàng đã được tạo. Vui lòng hoàn tất thanh toán.'
  } else {
    StatusIcon = Clock; iconBg = 'bg-yellow-100 text-yellow-600'
    statusTitle = 'Đang xử lý'
    statusDesc = 'Đơn hàng đang được xử lý.'
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-5">
      {/* Header */}
      <div className="text-center">
        <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl ${iconBg}`}>
          <StatusIcon className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-shop-text">{statusTitle}</h1>
        <p className="mt-2 text-sm font-medium text-shop-muted">{statusDesc}</p>

        {/* ── Đồng hồ đếm ngược ────────────────────────────────────────── */}
        {isPendingPayment && remaining != null && (
          <div className={`mt-4 inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-lg font-bold tabular-nums
            ${isExpired
              ? 'border-shop-error/30 bg-shop-error/10 text-shop-error'
              : remaining < 60_000
                ? 'border-orange-300 bg-orange-50 text-orange-600 animate-pulse'
                : 'border-orange-200 bg-orange-50 text-orange-600'}`}
          >
            <Clock className="h-5 w-5 shrink-0" />
            {isExpired ? 'Đã hết hạn' : formatCountdown(remaining)}
          </div>
        )}
      </div>

      {/* Tóm tắt đơn hàng */}
      <section className="mt-8 rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-shop-text">Thông tin đơn hàng</h2>
        <Row label="Mã đơn hàng" value={`#${order.id}`} strong />
        <Row label="Người nhận" value={order.receiverName} />
        <Row label="Địa chỉ" value={order.receiverAddress} />
        <Row label="Phương thức" value={METHOD_LABELS[order.paymentMethod] || order.paymentMethod} />
        <Row label="Trạng thái thanh toán"
          value={PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
          badge={paymentBadgeClass(order.paymentStatus)} />
        <hr className="my-4 border-shop-border" />
        <div className="flex justify-between text-base font-bold">
          <span>Tổng tiền</span>
          <span className="text-shop-red">{Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</span>
        </div>
      </section>

      {/* Nút xem QR cho BANK_TRANSFER */}
      {order.paymentMethod === 'BANK_TRANSFER' && isPendingPayment && !isExpired && (
        <section className="mt-5 rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-shop-text">
            <QrCode className="h-5 w-5 text-shop-red" /> Chuyển khoản ngân hàng
          </h2>
          <p className="mb-4 text-sm text-shop-muted">
            Hệ thống tự xác nhận qua SePay khi nhận đúng số tiền và nội dung. Không cần thao tác thêm.
          </p>
          <Button to={`/payment/bank-transfer/${orderId}`} className="w-full" variant="secondary">
            <QrCode className="h-4 w-4" /> Xem mã QR &amp; thông tin chuyển khoản
          </Button>
        </section>
      )}

      {/* Picker đổi phương thức */}
      {showMethodPicker && (
        <section className="mt-5 rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-shop-text">Chọn phương thức thanh toán</h2>
          <div className="space-y-3">
            {AVAILABLE_METHODS.map(({ value, label, Icon }) => (
              <button
                key={value}
                disabled={changingMethod}
                onClick={() => handleChangeMethod(value)}
                className={[
                  'flex w-full cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition',
                  value === order.paymentMethod
                    ? 'border-shop-red bg-shop-softBlue'
                    : 'border-shop-border bg-shop-surface hover:border-shop-red',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 shrink-0 text-shop-red" />
                <span className="text-sm font-bold text-shop-text">{label}</span>
                {value === order.paymentMethod && (
                  <span className="ml-auto text-xs font-medium text-shop-muted">Hiện tại</span>
                )}
              </button>
            ))}
          </div>
          <Button variant="secondary" className="mt-3 w-full" onClick={() => setShowMethodPicker(false)}>
            Đóng
          </Button>
        </section>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {/* VNPAY: Tiếp tục thanh toán */}
        {order.paymentMethod === 'VNPAY' && canRetry && (
          <Button onClick={handleVnpayPayment} disabled={paying}>
            <CreditCard className="h-4 w-4" />
            {paying ? 'Đang tạo link...' : 'Thanh toán bằng VNPAY'}
          </Button>
        )}

        {/* Đổi phương thức — ẩn khi hết hạn */}
        {canRetry && !showMethodPicker && (
          <Button variant="secondary" onClick={() => setShowMethodPicker(true)} disabled={changingMethod}>
            <RefreshCw className="h-4 w-4" /> Đổi phương thức
          </Button>
        )}

        {/* Hủy đơn — ẩn khi hết hạn (scheduler tự hủy) */}
        {canCancel && (
          <Button variant="danger" onClick={handleCancelOrder} disabled={cancelling}>
            <Ban className="h-4 w-4" />
            {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </Button>
        )}

        <Button to="/orders" variant="secondary">
          <ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value, strong, badge }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="font-medium text-shop-muted">{label}</span>
      {badge ? (
        <span className={`badge ${badge}`}>{value}</span>
      ) : (
        <span className={`text-right ${strong ? 'font-bold text-shop-text' : 'font-medium text-shop-text'}`}>{value}</span>
      )}
    </div>
  )
}

function paymentBadgeClass(status) {
  if (status === 'SUCCESS') return 'badge-success'
  if (status === 'FAILED' || status === 'CANCELLED') return 'badge-danger'
  return 'badge-warning'
}

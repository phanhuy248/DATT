import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Ban, Building2, Clock, CreditCard, QrCode, RefreshCw, Wallet } from 'lucide-react'
import { toast } from 'react-toastify'
import { cancelMyOrder, changePaymentMethod, getMyOrder } from '../../api/orders'
import { createVnpayPayment } from '../../api/payments'
import Button from '../../components/ui/Button'

const PAYMENT_LABELS = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  CANCELLED: 'Đã hủy thanh toán',
  REFUNDED: 'Đã hoàn tiền',
}

const METHOD_LABELS = {
  COD: 'Thanh toán khi nhận hàng',
  VNPAY: 'VNPAY',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

const AVAILABLE_METHODS = [
  { value: 'VNPAY', label: 'VNPAY', Icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', Icon: Building2 },
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', Icon: Wallet },
]

export default function OrderPaymentPage() {
  const { id: orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showMethodPicker, setShowMethodPicker] = useState(false)
  const [changingMethod, setChangingMethod] = useState(false)

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

  // Nếu đơn đã PAID → chuyển sang trang thành công
  useEffect(() => {
    if (order?.paymentStatus === 'PAID') {
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
    if (newMethod === order?.paymentMethod) {
      setShowMethodPicker(false)
      return
    }
    setChangingMethod(true)
    try {
      const updated = await changePaymentMethod(orderId, newMethod)
      setOrder(updated)
      setShowMethodPicker(false)
      if (newMethod === 'COD') {
        toast.success('Đã đổi sang thanh toán khi nhận hàng. Đơn hàng đang chờ xử lý.')
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

  if (order.status === 'CANCELLED') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-5">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-shop-error/10 text-shop-error">
            <Ban className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-shop-text">Đơn hàng đã bị hủy</h1>
          <p className="mt-2 text-sm text-shop-muted">Đơn hàng #{orderId} đã bị hủy.</p>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button to="/orders" variant="secondary"><ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi</Button>
          <Button to="/products">Tiếp tục mua sắm</Button>
        </div>
      </div>
    )
  }

  const isPending = order.paymentStatus === 'PENDING'
  const isCancelled = order.paymentStatus === 'CANCELLED'
  const isFailed = order.paymentStatus === 'FAILED'
  const canRetry = (isPending || isCancelled || isFailed) && order.status !== 'CANCELLED'
  const canCancel = order.status === 'PENDING' && order.paymentStatus !== 'PAID'

  let StatusIcon, iconBg, statusTitle, statusDesc
  if (isFailed) {
    StatusIcon = AlertCircle; iconBg = 'bg-shop-error/10 text-shop-error'
    statusTitle = 'Thanh toán thất bại'
    statusDesc = 'Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức khác.'
  } else if (isCancelled) {
    StatusIcon = AlertCircle; iconBg = 'bg-yellow-100 text-yellow-600'
    statusTitle = 'Đã hủy thanh toán'
    statusDesc = 'Bạn đã hủy giao dịch. Có thể thử lại hoặc chọn phương thức khác.'
  } else if (isPending && order.paymentMethod === 'BANK_TRANSFER') {
    StatusIcon = Clock; iconBg = 'bg-shop-success/10 text-shop-success'
    statusTitle = 'Chờ xác nhận chuyển khoản'
    statusDesc = 'Vui lòng chuyển khoản theo thông tin bên dưới rồi bấm xác nhận.'
  } else {
    StatusIcon = Clock; iconBg = 'bg-yellow-100 text-yellow-600'
    statusTitle = 'Chờ thanh toán'
    statusDesc = 'Đơn hàng đã được tạo. Vui lòng hoàn tất thanh toán.'
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
      </div>

      {/* Order summary */}
      <section className="mt-8 rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-shop-text">Thông tin đơn hàng</h2>
        <Row label="Mã đơn hàng" value={`#${order.id}`} strong />
        <Row label="Người nhận" value={order.receiverName} />
        <Row label="Địa chỉ" value={order.receiverAddress} />
        <Row label="Phương thức" value={METHOD_LABELS[order.paymentMethod] || order.paymentMethod} />
        <Row label="Trạng thái thanh toán" value={PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
          badge={paymentBadgeClass(order.paymentStatus)} />
        <hr className="my-4 border-shop-border" />
        <div className="flex justify-between text-base font-bold">
          <span>Tổng tiền</span>
          <span className="text-shop-red">{Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</span>
        </div>
      </section>

      {/* Bank transfer — link to full QR page */}
      {order.paymentMethod === 'BANK_TRANSFER' && order.status !== 'CANCELLED' && (
        <section className="mt-5 rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-shop-text">
            <QrCode className="h-5 w-5 text-shop-red" /> Chuyển khoản ngân hàng
          </h2>
          <p className="mb-4 text-sm text-shop-muted">
            Hệ thống tự xác nhận qua SePay khi nhận đúng số tiền và nội dung chuyển khoản. Không cần thao tác thêm.
          </p>
          <Button to={`/payment/bank-transfer/${orderId}`} className="w-full" variant="secondary">
            <QrCode className="h-4 w-4" /> Xem mã QR &amp; thông tin chuyển khoản
          </Button>
        </section>
      )}

      {/* Method picker */}
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
        {order.paymentMethod === 'VNPAY' && canRetry && (
          <Button onClick={handleVnpayPayment} disabled={paying}>
            <CreditCard className="h-4 w-4" />
            {paying ? 'Đang tạo link...' : 'Thanh toán bằng VNPAY'}
          </Button>
        )}
        {canRetry && !showMethodPicker && (
          <Button variant="secondary" onClick={() => setShowMethodPicker(true)} disabled={changingMethod}>
            <RefreshCw className="h-4 w-4" />
            Đổi phương thức
          </Button>
        )}
        {canCancel && (
          <Button variant="danger" onClick={handleCancelOrder} disabled={cancelling}>
            <Ban className="h-4 w-4" />
            {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </Button>
        )}
        <Button to="/orders" variant="secondary">
          <ArrowLeft className="h-4 w-4" />
          Đơn hàng của tôi
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
  if (status === 'PAID') return 'badge-success'
  if (status === 'FAILED' || status === 'CANCELLED') return 'badge-danger'
  return 'badge-warning'
}

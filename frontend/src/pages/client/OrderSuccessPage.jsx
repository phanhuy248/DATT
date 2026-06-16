import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Clock, CreditCard, QrCode, Receipt, ShoppingBag } from 'lucide-react'
import { toast } from 'react-toastify'
import { getMyOrder } from '../../api/orders'
import { createVnpayPayment } from '../../api/payments'
import { useCart } from '../../context/CartContext'
import Button from '../../components/ui/Button'

const PAYMENT_STATUS_LABEL = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  CANCELLED: 'Đã hủy thanh toán',
  REFUNDED: 'Đã hoàn tiền',
}

export default function OrderSuccessPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [payingVnpay, setPayingVnpay] = useState(false)
  const { fetchCart } = useCart()

  useEffect(() => {
    fetchCart()
    getMyOrder(orderId).then(setOrder).catch(() => {})
  }, [orderId])

  // VNPAY: show retry button for PENDING (cancelled) and FAILED (error), not for cancelled orders
  const canRetryVnpay = order?.paymentMethod === 'VNPAY' &&
    ['PENDING', 'FAILED'].includes(order?.paymentStatus) &&
    order?.status !== 'CANCELLED'
  const isPendingBankTransfer = order?.paymentMethod === 'BANK_TRANSFER' && order?.paymentStatus === 'PENDING'

  let title, description, Icon, iconClass
  if (canRetryVnpay) {
    const isFailed = order?.paymentStatus === 'FAILED'
    title = isFailed ? 'Thanh toán VNPAY thất bại' : 'Đơn hàng chưa được thanh toán'
    description = isFailed
      ? `Đơn hàng #${orderId} chưa được thanh toán do lỗi giao dịch. Bạn có thể thử lại.`
      : `Đơn hàng #${orderId} đã được tạo nhưng chưa thanh toán. Vui lòng thanh toán để hoàn tất.`
    Icon = AlertCircle
    iconClass = 'bg-yellow-100 text-yellow-600'
  } else if (isPendingBankTransfer) {
    title = 'Đã ghi nhận đơn chuyển khoản'
    description = `Đơn hàng #${orderId} đang chờ xác nhận thanh toán.`
    Icon = Clock
    iconClass = 'bg-shop-success/10 text-shop-success'
  } else {
    title = 'Đặt hàng thành công'
    description = `Cảm ơn bạn đã tin tưởng SMARTSHOP. Đơn hàng #${orderId} đã được tạo.`
    Icon = CheckCircle2
    iconClass = 'bg-shop-success/10 text-shop-success'
  }

  const handleVnpayRetry = async () => {
    setPayingVnpay(true)
    try {
      const result = await createVnpayPayment(orderId)
      window.location.href = result.paymentUrl
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo link thanh toán VNPAY')
      setPayingVnpay(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-5 lg:px-6">
      <div className="text-center">
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl ${iconClass}`}>
          <Icon className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold text-shop-text">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-shop-muted">{description}</p>
      </div>

      {order && (
        <section className="mt-8 rounded-2xl border border-shop-border bg-shop-surface p-5 text-left shadow-sm lg:p-6">
          <h2 className="mb-5 text-base font-bold text-shop-text">Chi tiết đơn hàng</h2>
          <div className="space-y-3">
            <InfoLine label="Mã đơn hàng" value={`#${order.id}`} strong />
            <InfoLine label="Người nhận" value={order.receiverName} />
            <InfoLine label="Số điện thoại" value={order.receiverPhone} />
            <InfoLine label="Địa chỉ" value={order.receiverAddress} wrap />
            <InfoLine label="Thanh toán" value={order.paymentMethod} />
            <InfoLine label="Trạng thái thanh toán" value={PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus} badge={paymentBadge(order.paymentStatus)} />
            <InfoLine label="Trạng thái đơn" value={order.status} badge="badge-warning" />
          </div>
          <hr className="my-5 border-shop-border" />
          <div className="flex justify-between gap-4 text-lg font-bold">
            <span>Tổng tiền</span>
            <span className="text-shop-red">{order.totalPrice?.toLocaleString('vi-VN')}đ</span>
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {canRetryVnpay && (
          <Button onClick={handleVnpayRetry} disabled={payingVnpay}>
            <CreditCard className="h-4 w-4" />
            {payingVnpay ? 'Đang tạo link...' : 'Thanh toán bằng VNPAY'}
          </Button>
        )}
        {isPendingBankTransfer && (
          <Button to={`/payment/bank-transfer/${orderId}`}>
            <QrCode className="h-4 w-4" />
            Xem QR chuyển khoản
          </Button>
        )}
        <Button to="/orders" variant="secondary">
          <Receipt className="h-4 w-4" />
          Xem đơn hàng
        </Button>
        <Button to="/products" variant={canRetryVnpay || isPendingBankTransfer ? 'secondary' : 'primary'}>
          <ShoppingBag className="h-4 w-4" />
          Tiếp tục mua sắm
        </Button>
      </div>
    </div>
  )
}

function InfoLine({ label, value, strong, wrap, badge }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="font-medium text-shop-muted">{label}</span>
      {badge ? (
        <span className={`badge ${badge}`}>{value}</span>
      ) : (
        <span className={`${strong ? 'font-bold' : 'font-medium'} text-shop-text ${wrap ? 'max-w-[260px] text-right leading-6' : ''}`}>{value}</span>
      )}
    </div>
  )
}

function paymentBadge(status) {
  if (status === 'PAID') return 'badge-success'
  if (status === 'FAILED' || status === 'CANCELLED') return 'badge-danger'
  return 'badge-warning'
}

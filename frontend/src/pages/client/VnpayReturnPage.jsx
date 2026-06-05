import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Receipt, ShoppingBag, XCircle } from 'lucide-react'
import { getMyOrder } from '../../api/orders'
import Button from '../../components/ui/Button'

const PAYMENT_STATUS_LABEL = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Đang chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
}

export default function VnpayReturnPage() {
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)

  const orderId = searchParams.get('orderId')
  const success = searchParams.get('success') === 'true'
  const validSignature = searchParams.get('validSignature') === 'true'
  const responseCode = searchParams.get('responseCode')
  const transactionNo = searchParams.get('transactionNo')
  const message = searchParams.get('message') || (success ? 'Thanh toán thành công' : 'Thanh toán không thành công')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!orderId || !token) return
    setLoading(true)
    getMyOrder(orderId)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  const paid = order?.paymentStatus === 'PAID' || success
  const StatusIcon = paid ? CheckCircle2 : XCircle

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-5 lg:px-6">
      <div className="text-center">
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl ${paid ? 'bg-shop-success/10 text-shop-success' : 'bg-shop-error/10 text-shop-error'}`}>
          <StatusIcon className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold text-shop-text">{paid ? 'Thanh toán VNPAY thành công' : 'Thanh toán VNPAY chưa hoàn tất'}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-shop-muted">{message}</p>
      </div>

      <section className="mt-8 rounded-2xl border border-shop-border bg-shop-surface p-5 text-left shadow-sm lg:p-6">
        <h2 className="mb-5 text-base font-bold text-shop-text">Thông tin giao dịch</h2>
        <InfoRow label="Mã đơn hàng" value={orderId ? `#${orderId}` : '-'} />
        <InfoRow label="Mã giao dịch VNPAY" value={transactionNo || '-'} />
        <InfoRow label="Mã phản hồi" value={responseCode || '-'} />
        <InfoRow label="Chữ ký VNPAY" value={validSignature ? 'Hợp lệ' : 'Không hợp lệ'} danger={!validSignature} />
        {loading ? (
          <div className="spinner" />
        ) : order && (
          <>
            <hr className="my-5 border-shop-border" />
            <InfoRow label="Trạng thái thanh toán" value={PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus} />
            <InfoRow label="Tổng tiền" value={`${Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ`} primary />
          </>
        )}
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {orderId && (
          <Button to={`/order-success/${orderId}`}>
            <Receipt className="h-4 w-4" />
            Xem đơn hàng
          </Button>
        )}
        <Button to="/products" variant="secondary">
          <ShoppingBag className="h-4 w-4" />
          Tiếp tục mua sắm
        </Button>
      </div>
    </div>
  )
}

function InfoRow({ label, value, primary = false, danger = false }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="font-medium text-shop-muted">{label}</span>
      <span className={`text-right font-bold ${danger ? 'text-shop-error' : primary ? 'text-shop-red' : 'text-shop-text'}`}>{value}</span>
    </div>
  )
}

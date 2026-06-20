import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, Clock, Receipt, X, ZoomIn } from 'lucide-react'
import { toast } from 'react-toastify'
import { getBankTransferPaymentInfo } from '../../api/payments'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'

const PAYMENT_EXPIRE_MS = 5 * 60 * 1000 // 5 phút

const STATUS_LABEL = {
  UNPAID:   'Chưa chuyển khoản',
  PENDING:  'Chờ xác nhận tự động',
  SUCCESS:  'Đã thanh toán',
  FAILED:   'Thanh toán thất bại',
  CANCELLED:'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
}

const STATUS_BADGE = {
  UNPAID:   'badge-secondary',
  PENDING:  'badge-warning',
  SUCCESS:  'badge-success',
  FAILED:   'badge-danger',
  CANCELLED:'badge-danger',
  REFUNDED: 'badge-info',
}

const POLL_INTERVAL_MS = 5000

/** Đồng hồ đếm ngược từ createdDate + 5 phút */
function useCountdown(createdDate) {
  const [remaining, setRemaining] = useState(null)
  useEffect(() => {
    if (!createdDate) return
    const expireAt = new Date(createdDate).getTime() + PAYMENT_EXPIRE_MS
    const tick = () => setRemaining(Math.max(0, expireAt - Date.now()))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
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

export default function BankTransferPaymentPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [zoomOpen, setZoomOpen] = useState(false)
  const pollRef = useRef(null)

  const remaining = useCountdown(info?.createdDate)
  const isExpired = remaining === 0

  const stopPolling = () => clearInterval(pollRef.current)

  useEffect(() => {
    setLoading(true)
    getBankTransferPaymentInfo(orderId)
      .then((data) => {
        setInfo(data)
        if (data.paymentStatus === 'SUCCESS') {
          navigate(`/order-success/${orderId}`, { replace: true })
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Không tải được thông tin chuyển khoản')
        navigate('/orders')
      })
      .finally(() => setLoading(false))
    return stopPolling
  }, [navigate, orderId])

  // Poll cho đến khi trạng thái đóng hoặc hết hạn
  useEffect(() => {
    if (!info) return
    const closed = ['SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(info.paymentStatus)
    if (closed || isExpired) { stopPolling(); return }

    pollRef.current = setInterval(async () => {
      try {
        const updated = await getBankTransferPaymentInfo(orderId)
        setInfo(updated)
        if (updated.paymentStatus === 'SUCCESS') {
          stopPolling()
          toast.success('Thanh toán thành công! Đang chuyển hướng...')
          navigate(`/order-success/${orderId}`, { replace: true })
        } else if (['FAILED', 'CANCELLED', 'REFUNDED'].includes(updated.paymentStatus)) {
          stopPolling()
        }
      } catch { /* bỏ qua lỗi mạng tạm thời */ }
    }, POLL_INTERVAL_MS)

    return stopPolling
  }, [info?.paymentStatus, orderId, navigate, isExpired])

  if (loading) return <div className="spinner" />
  if (!info) return null

  const amount = Number(info.amount || 0)
  const paid = info.paymentStatus === 'SUCCESS'
  const qrSrc = info.qrUrl || info.qrImageUrl

  // ── Hết hạn hoặc đơn đã bị hủy ─────────────────────────────────────────
  if (isExpired || info.orderStatus === 'CANCELLED') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-5">
        <div className="mb-5">
          <Button to="/orders" variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi
          </Button>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-shop-error/10 text-shop-error">
            <Ban className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-shop-text">🔴 Đã hủy</h1>
          <p className="mt-2 text-sm font-medium text-shop-muted">
            Đơn hàng đã hết hạn thanh toán. Vui lòng tạo đơn mới.
          </p>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button to="/orders" variant="secondary"><ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi</Button>
          <Button to="/products">Tiếp tục mua sắm</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-5 lg:px-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button to="/orders" variant="secondary" size="sm">
          <ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi
        </Button>
      </div>

      <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <SectionHeader
            title="Thanh toán bằng QR ngân hàng"
            subtitle="Chuyển đúng số tiền và nội dung — hệ thống tự xác nhận ngay khi nhận tiền"
          />
          <span className={`badge ${STATUS_BADGE[info.paymentStatus] || 'badge-secondary'}`}>
            {STATUS_LABEL[info.paymentStatus] || info.paymentStatus}
          </span>
        </div>

        {/* ── Đồng hồ đếm ngược ─────────────────────────────────────────── */}
        {!paid && remaining != null && (
          <div className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3
            ${remaining < 60_000
              ? 'border-shop-error/40 bg-shop-error/10 text-shop-error animate-pulse'
              : 'border-orange-200 bg-orange-50 text-orange-700'}`}
          >
            <Clock className="h-5 w-5 shrink-0" />
            <span className="text-sm font-bold">
              Thời gian còn lại: <span className="text-xl tabular-nums">{formatCountdown(remaining)}</span>
            </span>
            <span className="ml-auto text-xs font-medium opacity-70">
              QR hết hạn sau {Math.ceil(remaining / 60_000)} phút
            </span>
          </div>
        )}

        {/* Thông báo chờ tự động */}
        {!paid && ['PENDING', 'UNPAID'].includes(info.paymentStatus) && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <Clock className="h-4 w-4 shrink-0 animate-pulse" />
            <span>Trang tự cập nhật khi nhận được tiền qua SePay. Không cần xác nhận thủ công.</span>
          </div>
        )}

        <div className="checkout-layout grid items-start gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
          {/* QR */}
          <div className="rounded-2xl border border-shop-border bg-shop-bg p-5 text-center">
            {qrSrc ? (
              <div className="relative inline-block w-full max-w-[360px]">
                <img
                  src={qrSrc}
                  alt={`QR chuyển khoản đơn hàng ${info.orderId}`}
                  className="mx-auto aspect-square w-full cursor-zoom-in object-contain"
                  onClick={() => setZoomOpen(true)}
                />
                <button
                  onClick={() => setZoomOpen(true)}
                  className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-shop-muted shadow hover:bg-white"
                >
                  <ZoomIn className="h-3.5 w-3.5" /> Phóng to
                </button>
              </div>
            ) : (
              <div className="flex aspect-square w-full max-w-[360px] items-center justify-center text-sm text-shop-muted mx-auto">
                Không tải được mã QR
              </div>
            )}
          </div>

          {/* Thông tin chuyển khoản */}
          <div>
            <div className="grid gap-3">
              <InfoRow label="Mã đơn hàng" value={`#${info.orderId}`} />
              <InfoRow label="Số tiền cần chuyển" value={`${amount.toLocaleString('vi-VN')}đ`} primary />
              <InfoRow label="Nội dung chuyển khoản" value={info.transferContent} strong />
              <InfoRow label="Ngân hàng" value={info.bankName || info.bankId} />
              <InfoRow label="Số tài khoản" value={info.accountNumber} strong />
              <InfoRow label="Chủ tài khoản" value={info.accountName} />
              {info.branch && <InfoRow label="Chi nhánh" value={info.branch} />}
            </div>

            <div className="mt-5 rounded-2xl border border-shop-border bg-shop-bg p-4 text-sm font-medium leading-6 text-shop-muted">
              <p className="mb-1 font-bold text-shop-text">Lưu ý quan trọng</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Nhập đúng nội dung chuyển khoản <strong className="text-shop-text">{info.transferContent}</strong></li>
                <li>Chuyển đúng số tiền <strong className="text-shop-text">{amount.toLocaleString('vi-VN')}đ</strong></li>
                <li>Hệ thống tự xác nhận — không cần thao tác thêm.</li>
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button to={`/orders/${info.orderId}/payment`} variant="secondary">
                <Receipt className="h-4 w-4" /> Xem đơn hàng
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* QR zoom modal */}
      {zoomOpen && qrSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setZoomOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>
            <img
              src={qrSrc}
              alt="QR phóng to"
              className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain shadow-2xl"
            />
            <p className="mt-3 text-center text-sm font-semibold text-white">
              {info.transferContent} · {amount.toLocaleString('vi-VN')}đ
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, primary = false, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-shop-border pb-3 text-sm">
      <span className="font-medium text-shop-muted">{label}</span>
      <span className={`${strong ? 'font-bold' : 'font-semibold'} text-right ${primary ? 'text-shop-red' : 'text-shop-text'}`}>
        {value}
      </span>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Receipt, Send } from 'lucide-react'
import { toast } from 'react-toastify'
import { confirmBankTransfer, getBankTransferPaymentInfo } from '../../api/payments'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'

const STATUS_LABEL = {
  UNPAID: 'Chưa chuyển khoản',
  PENDING: 'Chờ xác nhận',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán bị từ chối',
  REFUNDED: 'Đã hoàn tiền',
}

const STATUS_BADGE = {
  UNPAID: 'badge-secondary',
  PENDING: 'badge-warning',
  PAID: 'badge-success',
  FAILED: 'badge-danger',
  REFUNDED: 'badge-info',
}

export default function BankTransferPaymentPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setLoading(true)
    getBankTransferPaymentInfo(orderId)
      .then(setInfo)
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Không tải được thông tin chuyển khoản')
        navigate('/orders')
      })
      .finally(() => setLoading(false))
  }, [navigate, orderId])

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmBankTransfer(orderId)
      toast.success('Đã ghi nhận chuyển khoản. Đơn hàng đang chờ xác nhận.')
      navigate(`/order-success/${orderId}`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xác nhận chuyển khoản')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <div className="spinner" />
  if (!info) return null

  const amount = Number(info.amount || 0)
  const waitingApproval = info.paymentStatus === 'PENDING'
  const paid = info.paymentStatus === 'PAID'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-5 lg:px-6">
      <div className="mb-5">
        <Button to="/orders" variant="secondary" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Đơn hàng của tôi
        </Button>
      </div>

      <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <SectionHeader title="Thanh toán bằng QR ngân hàng" subtitle="Chuyển đúng số tiền và nội dung để đơn hàng được đối soát nhanh" />
          <span className={`badge ${STATUS_BADGE[info.paymentStatus] || 'badge-secondary'}`}>
            {STATUS_LABEL[info.paymentStatus] || info.paymentStatus}
          </span>
        </div>

        <div className="checkout-layout grid items-start gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
          <div className="rounded-2xl border border-shop-border bg-shop-bg p-5 text-center">
            <img src={info.qrImageUrl} alt={`QR chuyển khoản đơn hàng ${info.orderId}`} className="mx-auto aspect-square w-full max-w-[360px] object-contain" />
          </div>

          <div>
            <div className="grid gap-3">
              <InfoRow label="Mã đơn hàng" value={`#${info.orderId}`} />
              <InfoRow label="Số tiền" value={`${amount.toLocaleString('vi-VN')}đ`} primary />
              <InfoRow label="Nội dung chuyển khoản" value={info.transferContent} strong />
              <InfoRow label="Ngân hàng" value={info.bankName || info.bankId} />
              <InfoRow label="Số tài khoản" value={info.accountNumber} strong />
              <InfoRow label="Chủ tài khoản" value={info.accountName} />
              {info.branch && <InfoRow label="Chi nhánh" value={info.branch} />}
            </div>

            <div className="mt-5 rounded-2xl border border-shop-border bg-shop-bg p-4 text-sm font-medium leading-6 text-shop-muted">
              <p className="mb-1 font-bold text-shop-text">Lưu ý đối soát</p>
              <p>SMARTSHOP chỉ xác nhận khi nhận đúng số tiền và đúng nội dung chuyển khoản.</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleConfirm} disabled={confirming || waitingApproval || paid}>
                <Send className="h-4 w-4" />
                {paid ? 'Đã thanh toán' : waitingApproval ? 'Đang chờ xác nhận' : confirming ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}
              </Button>
              <Button to={`/order-success/${info.orderId}`} variant="secondary">
                <Receipt className="h-4 w-4" />
                Xem đơn hàng
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function InfoRow({ label, value, primary = false, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-shop-border pb-3 text-sm">
      <span className="font-medium text-shop-muted">{label}</span>
      <span className={`${strong ? 'font-bold' : 'font-semibold'} text-right ${primary ? 'text-shop-red' : 'text-shop-text'}`}>{value}</span>
    </div>
  )
}

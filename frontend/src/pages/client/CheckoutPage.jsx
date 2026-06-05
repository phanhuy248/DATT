import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CheckCircle2, CreditCard, Package, Truck, Wallet } from 'lucide-react'
import { toast } from 'react-toastify'
import { validateCoupon } from '../../api/coupons'
import { placeOrder } from '../../api/orders'
import { createVnpayPayment } from '../../api/payments'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getImageUrl } from '../../utils/image'

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng', icon: Wallet, helper: 'Thanh toán trực tiếp khi nhận sản phẩm.' },
  { value: 'VNPAY', label: 'Thanh toán online qua VNPAY', icon: CreditCard, helper: 'Chuyển sang cổng VNPAY để hoàn tất thanh toán bảo mật.' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng bằng QR', icon: Building2, helper: 'Sau khi đặt hàng, hệ thống hiển thị QR đúng số tiền và mã đơn.' },
]

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    receiverName: user?.fullName || '',
    receiverAddress: user?.address || '',
    receiverPhone: user?.phone || '',
    paymentMethod: 'COD',
  })
  const [errors, setErrors] = useState({})
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)

  const validate = () => {
    const next = {}
    if (!form.receiverName) next.receiverName = 'Tên người nhận không được để trống'
    if (!form.receiverAddress) next.receiverAddress = 'Địa chỉ không được để trống'
    if (!form.receiverPhone) next.receiverPhone = 'Số điện thoại không được để trống'
    return next
  }

  const handleSubmit = async (event) => {
    event?.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    if (!cart.items?.length) {
      toast.error('Giỏ hàng trống')
      return
    }

    setLoading(true)
    try {
      const items = cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      const order = await placeOrder({ ...form, couponCode: coupon?.code || couponCode, items })
      if (form.paymentMethod === 'VNPAY') {
        const payment = await createVnpayPayment(order.id)
        await clearCart()
        window.location.href = payment.paymentUrl
        return
      }
      if (form.paymentMethod === 'BANK_TRANSFER') {
        await clearCart()
        toast.success('Đã tạo đơn hàng. Vui lòng quét QR để chuyển khoản.')
        navigate(`/payment/bank-transfer/${order.id}`)
        return
      }
      await clearCart()
      toast.success('Đặt hàng thành công')
      navigate(`/order-success/${order.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại')
    } finally {
      setLoading(false)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      const result = await validateCoupon(couponCode.trim(), cart.totalPrice)
      setCoupon(result)
      toast.success('Đã áp dụng mã giảm giá')
    } catch (err) {
      setCoupon(null)
      toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    }
  }

  if (!cart.items?.length) {
    navigate('/cart')
    return null
  }

  const discountAmount = Number(coupon?.discountAmount || 0)
  const finalAmount = Math.max(0, Number(cart.totalPrice || 0) - discountAmount)
  const selectedPayment = PAYMENT_METHODS.find((method) => method.value === form.paymentMethod)
  const submitLabel = form.paymentMethod === 'VNPAY'
    ? 'Thanh toán VNPAY'
    : form.paymentMethod === 'BANK_TRANSFER'
      ? 'Đặt hàng và xem mã QR'
      : 'Đặt hàng'

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 lg:px-6">
      <SectionHeader title="Thanh toán" subtitle="Kiểm tra thông tin giao hàng và phương thức thanh toán" />

      <div className="checkout-layout grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-shop-text">
                <Truck className="h-5 w-5 text-shop-red" />
                Thông tin giao hàng
              </h2>
              {(user?.phone || user?.address) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-shop-success/10 px-3 py-1 text-xs font-bold text-shop-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Từ tài khoản
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên người nhận" error={errors.receiverName}>
                <input className="form-control" value={form.receiverName} onChange={(event) => setForm({ ...form, receiverName: event.target.value })} />
              </Field>
              <Field label="Số điện thoại" error={errors.receiverPhone}>
                <input className="form-control" value={form.receiverPhone} onChange={(event) => setForm({ ...form, receiverPhone: event.target.value })} />
              </Field>
            </div>
            <Field label="Địa chỉ giao hàng" error={errors.receiverAddress}>
              <textarea
                className="form-control"
                rows={3}
                value={form.receiverAddress}
                onChange={(event) => setForm({ ...form, receiverAddress: event.target.value })}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
            </Field>
          </section>

          <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-shop-text">
              <CreditCard className="h-5 w-5 text-shop-red" />
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                const checked = form.paymentMethod === method.value
                return (
                  <label
                    key={method.value}
                    className={[
                      'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                      checked ? 'border-shop-red bg-shop-softBlue' : 'border-shop-border bg-shop-surface hover:border-shop-red',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={checked}
                      onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}
                      className="mt-1 h-4 w-4 accent-shop-red"
                    />
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-shop-red" />
                    <span>
                      <span className="block text-sm font-bold text-shop-text">{method.label}</span>
                      <span className="mt-1 block text-xs font-medium leading-5 text-shop-muted">{method.helper}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {selectedPayment?.helper && (
              <p className="mt-4 rounded-2xl border border-shop-border bg-shop-bg p-4 text-sm font-medium leading-6 text-shop-muted">
                {selectedPayment.helper}
              </p>
            )}
          </section>
        </form>

        <aside className="checkout-summary sticky top-24 rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
          <h2 className="text-base font-bold text-shop-text">Đơn hàng của bạn</h2>

          <div className="mt-5 space-y-4">
            {cart.items.map((item) => (
              <div className="checkout-summary-item flex items-center gap-3" key={item.cartItemId}>
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-shop-softBlue">
                  {item.productImage ? (
                    <img src={getImageUrl(item.productImage)} alt="" className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-shop-muted">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-shop-text">{item.productName}</p>
                  <p className="mt-1 text-xs font-medium text-shop-muted">x{item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-shop-text">{item.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
            ))}
          </div>

          <hr className="my-5 border-shop-border" />

          <div className="checkout-coupon-row flex gap-2">
            <input
              className="form-control"
              placeholder="Mã giảm giá"
              value={couponCode}
              onChange={(event) => {
                setCouponCode(event.target.value)
                setCoupon(null)
              }}
            />
            <Button type="button" variant="secondary" onClick={applyCoupon}>
              Áp dụng
            </Button>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <SummaryLine label="Tạm tính" value={`${cart.totalPrice.toLocaleString('vi-VN')}đ`} />
            {discountAmount > 0 && <SummaryLine label={`Giảm giá (${coupon.code})`} value={`-${discountAmount.toLocaleString('vi-VN')}đ`} success />}
            <SummaryLine label="Phí vận chuyển" value="Miễn phí" success />
          </div>

          <hr className="my-5 border-shop-border" />

          <div className="flex justify-between gap-4 text-lg font-bold">
            <span>Tổng cộng</span>
            <span className="text-shop-red">{finalAmount.toLocaleString('vi-VN')}đ</span>
          </div>

          <Button className="mt-6 w-full" onClick={handleSubmit} disabled={loading} size="lg">
            <CheckCircle2 className="h-4 w-4" />
            {loading ? 'Đang xử lý...' : submitLabel}
          </Button>
          <p className="mt-3 text-center text-xs font-medium leading-5 text-shop-muted">
            Bằng cách đặt hàng, bạn đồng ý với điều khoản dịch vụ của SMARTSHOP.
          </p>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="form-group block">
      <span className="form-label">{label} *</span>
      {children}
      {error && <p className="form-error">{error}</p>}
    </label>
  )
}

function SummaryLine({ label, value, success }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-medium text-shop-muted">{label}</span>
      <span className={`font-bold ${success ? 'text-shop-success' : 'text-shop-text'}`}>{value}</span>
    </div>
  )
}

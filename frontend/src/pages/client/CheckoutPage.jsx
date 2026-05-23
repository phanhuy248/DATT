import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { placeOrder } from '../../api/orders'
import { validateCoupon } from '../../api/coupons'
import { toast } from 'react-toastify'

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', icon: 'fa-money-bill-wave' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', icon: 'fa-building-columns' },
  { value: 'MOMO', label: 'Ví MoMo', icon: 'fa-wallet' },
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
    const e = {}
    if (!form.receiverName) e.receiverName = 'Tên người nhận không được để trống'
    if (!form.receiverAddress) e.receiverAddress = 'Địa chỉ không được để trống'
    if (!form.receiverPhone) e.receiverPhone = 'Số điện thoại không được để trống'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!cart.items?.length) { toast.error('Giỏ hàng trống'); return }

    setLoading(true)
    try {
      const items = cart.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      const order = await placeOrder({ ...form, couponCode: coupon?.code || couponCode, items })
      await clearCart()
      toast.success('Đặt hàng thành công!')
      navigate(`/order-success/${order.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại')
    } finally { setLoading(false) }
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

  const discountAmount = Number(coupon?.discountAmount || 0)
  const finalAmount = Math.max(0, Number(cart.totalPrice || 0) - discountAmount)

  if (!cart.items?.length) {
    navigate('/cart'); return null
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        <i className="fa-solid fa-credit-card" style={{ marginRight: 10, color: '#2563eb' }} />
        Thanh toán
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit}>
          {/* Shipping Info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>
                  <i className="fa-solid fa-truck" style={{ marginRight: 8, color: '#2563eb' }} />
                  Thông tin giao hàng
                </h2>
                {(user?.phone || user?.address) && (
                  <span style={{ fontSize: 12, color: '#16a34a', background: '#f0fdf4', padding: '3px 8px', borderRadius: 4, border: '1px solid #bbf7d0' }}>
                    <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }} />
                    Đã lấy từ tài khoản
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Tên người nhận *</label>
                <input className="form-control" value={form.receiverName}
                  onChange={e => setForm({ ...form, receiverName: e.target.value })} />
                {errors.receiverName && <p className="form-error">{errors.receiverName}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại *</label>
                <input className="form-control" value={form.receiverPhone}
                  onChange={e => setForm({ ...form, receiverPhone: e.target.value })} />
                {errors.receiverPhone && <p className="form-error">{errors.receiverPhone}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ giao hàng *</label>
                <textarea className="form-control" rows={3} value={form.receiverAddress}
                  onChange={e => setForm({ ...form, receiverAddress: e.target.value })}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" />
                {errors.receiverAddress && <p className="form-error">{errors.receiverAddress}</p>}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card">
            <div className="card-body">
              <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
                <i className="fa-solid fa-wallet" style={{ marginRight: 8, color: '#2563eb' }} />
                Phương thức thanh toán
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PAYMENT_METHODS.map(m => (
                  <label key={m.value} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    border: `2px solid ${form.paymentMethod === m.value ? '#2563eb' : '#e2e8f0'}`,
                    borderRadius: 8, cursor: 'pointer',
                    background: form.paymentMethod === m.value ? '#eff6ff' : '#fff',
                  }}>
                    <input type="radio" name="payment" value={m.value} checked={form.paymentMethod === m.value}
                      onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                      style={{ accentColor: '#2563eb' }} />
                    <i className={`fa-solid ${m.icon}`} style={{ color: '#2563eb', width: 20 }} />
                    <span style={{ fontSize: 14 }}>{m.label}</span>
                  </label>
                ))}
              </div>
              {form.paymentMethod === 'BANK_TRANSFER' && (
                <div style={{ marginTop: 16, padding: 16, background: '#f0f9ff', borderRadius: 8, fontSize: 13 }}>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>Thông tin chuyển khoản:</p>
                  <p>Ngân hàng: VietcomBank</p>
                  <p>Số tài khoản: 1234567890</p>
                  <p>Chủ tài khoản: SMARTSHOP</p>
                  <p style={{ marginTop: 8, color: '#6b7280' }}>Nội dung: [Họ tên] - [SĐT]</p>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Order Summary */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-body">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Đơn hàng của bạn</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {cart.items.map(item => (
                <div key={item.cartItemId} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, background: '#f8fafc', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                    {item.productImage
                      ? <img src={`/uploads/${item.productImage}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-image" style={{ color: '#cbd5e1' }} />
                        </div>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{item.productName}</p>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>x{item.quantity}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
              ))}
            </div>
            <hr className="divider" />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-control" placeholder="Mã giảm giá" value={couponCode}
                onChange={e => { setCouponCode(e.target.value); setCoupon(null) }} />
              <button type="button" className="btn btn-secondary" onClick={applyCoupon}>Áp dụng</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span>Tạm tính</span>
              <span>{cart.totalPrice.toLocaleString('vi-VN')}₫</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#16a34a' }}>
                <span>Giảm giá ({coupon.code})</span>
                <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14 }}>
              <span>Phí vận chuyển</span>
              <span style={{ color: '#16a34a', fontWeight: 500 }}>Miễn phí</span>
            </div>
            <hr className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
              <span>Tổng cộng</span>
              <span style={{ color: '#2563eb' }}>{finalAmount.toLocaleString('vi-VN')}₫</span>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin" /> Đang xử lý...</>
                : <><i className="fa-solid fa-check" /> Đặt hàng</>}
            </button>
            <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>
              Bằng cách đặt hàng, bạn đồng ý với điều khoản dịch vụ của chúng tôi
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

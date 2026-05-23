import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { toast } from 'react-toastify'

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart()
  const navigate = useNavigate()

  const handleUpdate = async (cartItemId, quantity) => {
    if (quantity < 1) return
    try { await updateItem(cartItemId, quantity) }
    catch { toast.error('Không thể cập nhật số lượng') }
  }

  const handleRemove = async (cartItemId) => {
    try { await removeItem(cartItemId); toast.success('Đã xóa sản phẩm') }
    catch { toast.error('Không thể xóa sản phẩm') }
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="empty-state">
          <i className="fa-solid fa-cart-shopping" />
          <p>Giỏ hàng của bạn đang trống</p>
          <Link to="/products" className="btn btn-primary mt-4">Tiếp tục mua sắm</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        <i className="fa-solid fa-cart-shopping" style={{ marginRight: 10, color: '#2563eb' }} />
        Giỏ hàng ({cart.totalItems} sản phẩm)
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cart.items.map(item => (
            <div key={item.cartItemId} className="card">
              <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Link to={`/products/${item.productId}`}>
                  <div style={{ width: 80, height: 80, background: '#f8fafc', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    {item.productImage
                      ? <img src={`/uploads/${item.productImage}`} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-image" style={{ color: '#cbd5e1', fontSize: 24 }} />
                        </div>
                    }
                  </div>
                </Link>
                <div style={{ flex: 1 }}>
                  <Link to={`/products/${item.productId}`} style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>
                    {item.productName}
                  </Link>
                  <p style={{ color: '#2563eb', fontWeight: 600, marginTop: 4 }}>
                    {item.productPrice.toLocaleString('vi-VN')}₫
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => handleUpdate(item.cartItemId, item.quantity - 1)}
                    style={{ width: 32, height: 32, border: 'none', background: '#f1f5f9', cursor: 'pointer' }}>-</button>
                  <span style={{ width: 40, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{item.quantity}</span>
                  <button onClick={() => handleUpdate(item.cartItemId, item.quantity + 1)}
                    style={{ width: 32, height: 32, border: 'none', background: '#f1f5f9', cursor: 'pointer' }}>+</button>
                </div>
                <span style={{ fontWeight: 700, color: '#1e293b', minWidth: 100, textAlign: 'right' }}>
                  {item.subtotal.toLocaleString('vi-VN')}₫
                </span>
                <button onClick={() => handleRemove(item.cartItemId)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4, fontSize: 16 }}>
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-body">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Tóm tắt đơn hàng</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {cart.items.map(item => (
                <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>{item.productName} × {item.quantity}</span>
                  <span>{item.subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
              ))}
            </div>
            <hr className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
              <span>Tổng cộng</span>
              <span style={{ color: '#2563eb' }}>{cart.totalPrice.toLocaleString('vi-VN')}₫</span>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/checkout')} disabled={loading}>
              <i className="fa-solid fa-credit-card" /> Tiến hành thanh toán
            </button>
            <Link to="/products" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: '#6b7280', fontSize: 13 }}>
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

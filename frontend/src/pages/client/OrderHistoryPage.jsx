import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../../api/orders'

const STATUS_BADGE = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  SHIPPING: 'badge-info',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
}

const STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getMyOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        <i className="fa-solid fa-receipt" style={{ marginRight: 10, color: '#2563eb' }} />
        Lịch sử đơn hàng
      </h1>

      {orders.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-box-open" />
          <p>Bạn chưa có đơn hàng nào</p>
          <Link to="/products" className="btn btn-primary mt-4">Mua sắm ngay</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Đơn hàng #{order.id}</span>
                    <span style={{ marginLeft: 12, fontSize: 13, color: '#6b7280' }}>
                      {new Date(order.createdDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge ${STATUS_BADGE[order.status] || 'badge-secondary'}`}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>
                      {order.totalPrice?.toLocaleString('vi-VN')}₫
                    </span>
                    <button
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                      {expanded === order.id ? 'Thu gọn' : 'Chi tiết'}
                    </button>
                  </div>
                </div>

                {expanded === order.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
                      <div>
                        <p style={{ color: '#6b7280', marginBottom: 2 }}>Người nhận</p>
                        <p style={{ fontWeight: 500 }}>{order.receiverName}</p>
                      </div>
                      <div>
                        <p style={{ color: '#6b7280', marginBottom: 2 }}>Số điện thoại</p>
                        <p style={{ fontWeight: 500 }}>{order.receiverPhone}</p>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ color: '#6b7280', marginBottom: 2 }}>Địa chỉ giao hàng</p>
                        <p style={{ fontWeight: 500 }}>{order.receiverAddress}</p>
                      </div>
                      <div>
                        <p style={{ color: '#6b7280', marginBottom: 2 }}>Thanh toán</p>
                        <p style={{ fontWeight: 500 }}>{order.paymentMethod || 'COD'}</p>
                      </div>
                    </div>

                    <h4 style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Sản phẩm</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {order.items?.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px', background: '#f8fafc', borderRadius: 6 }}>
                          <div style={{ width: 48, height: 48, background: '#fff', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                            {item.productImage
                              ? <img src={`/uploads/${item.productImage}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="fa-solid fa-image" style={{ color: '#cbd5e1' }} />
                                </div>
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <Link to={`/products/${item.productId}`} style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>
                              {item.productName}
                            </Link>
                          </div>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>x{item.quantity}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 90, textAlign: 'right' }}>
                            {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

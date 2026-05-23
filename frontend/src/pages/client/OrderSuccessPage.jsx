import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMyOrder } from '../../api/orders'

export default function OrderSuccessPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => { getMyOrder(orderId).then(setOrder).catch(() => {}) }, [orderId])

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <i className="fa-solid fa-check" style={{ fontSize: 36, color: '#16a34a' }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Đặt hàng thành công!</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Cảm ơn bạn đã tin tưởng SmartShop. Đơn hàng #{orderId} đã được xác nhận.
        </p>

        {order && (
          <div className="card" style={{ textAlign: 'left', marginBottom: 24 }}>
            <div className="card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Chi tiết đơn hàng</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#6b7280' }}>Mã đơn hàng</span>
                  <span style={{ fontWeight: 600 }}>#{order.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#6b7280' }}>Người nhận</span>
                  <span>{order.receiverName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#6b7280' }}>Số điện thoại</span>
                  <span>{order.receiverPhone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#6b7280' }}>Địa chỉ</span>
                  <span style={{ textAlign: 'right', maxWidth: 200 }}>{order.receiverAddress}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#6b7280' }}>Thanh toán</span>
                  <span>{order.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#6b7280' }}>Trạng thái</span>
                  <span className="badge badge-warning">{order.status}</span>
                </div>
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
                <span>Tổng tiền</span>
                <span style={{ color: '#2563eb' }}>{order.totalPrice?.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/orders" className="btn btn-outline">
            <i className="fa-solid fa-receipt" /> Xem đơn hàng
          </Link>
          <Link to="/products" className="btn btn-primary">
            <i className="fa-solid fa-shopping-bag" /> Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  )
}

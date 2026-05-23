import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/orders'

const STATUS_LABEL = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy' }
const STATUS_BADGE = { PENDING: 'badge-warning', CONFIRMED: 'badge-info', SHIPPING: 'badge-info', DELIVERED: 'badge-success', CANCELLED: 'badge-danger' }

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getDashboard()
      .then(setData)
      .catch(err => setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="spinner" />

  if (error) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 40, color: '#ef4444', marginBottom: 16 }} />
      <p style={{ color: '#374151', fontSize: 15, marginBottom: 16 }}>{error}</p>
      <button className="btn btn-primary" onClick={load}><i className="fa-solid fa-rotate-right" /> Thử lại</button>
    </div>
  )

  const stats = [
    { label: 'Tổng đơn hàng', value: data?.totalOrders ?? 0, icon: 'fa-receipt', color: '#2563eb', bg: '#dbeafe' },
    { label: 'Doanh thu', value: `${(data?.totalRevenue ?? 0).toLocaleString('vi-VN')}₫`, icon: 'fa-sack-dollar', color: '#16a34a', bg: '#dcfce7' },
    { label: 'Sản phẩm', value: data?.totalProducts ?? 0, icon: 'fa-box', color: '#d97706', bg: '#fef3c7' },
    { label: 'Người dùng', value: data?.totalUsers ?? 0, icon: 'fa-users', color: '#7c3aed', bg: '#ede9fe' },
  ]

  const totalOrders = Object.values(data?.ordersByStatus || {}).reduce((a, b) => a + b, 0) || 1

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Dashboard</h1>
        <button className="btn btn-secondary btn-sm" onClick={load} title="Làm mới">
          <i className="fa-solid fa-rotate-right" /> Làm mới
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} className="card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 22 }} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Order Status */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Đơn hàng theo trạng thái</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(data?.ordersByStatus || {}).every(([, v]) => v === 0)
                ? <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Chưa có đơn hàng</p>
                : Object.entries(data?.ordersByStatus || {}).map(([status, count]) => {
                    const pct = Math.round((count / totalOrders) * 100)
                    return (
                      <div key={status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                          <span>{STATUS_LABEL[status]}</span>
                          <span style={{ fontWeight: 600 }}>{count}</span>
                        </div>
                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#2563eb', borderRadius: 3, transition: 'width 0.6s' }} />
                        </div>
                      </div>
                    )
                  })}
            </div>
          </div>
        </div>

        {/* Top Selling */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>Sản phẩm bán chạy</h3>
              <Link to="/admin/products" style={{ fontSize: 12, color: '#2563eb' }}>Xem tất cả</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data?.topSellingProducts || []).length === 0
                ? <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Chưa có sản phẩm</p>
                : (data?.topSellingProducts || []).map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 20, height: 20, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: '#6b7280' }}>Đã bán: {p.sold}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{p.price?.toLocaleString('vi-VN')}₫</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>Đơn hàng gần đây</h3>
              <Link to="/admin/orders" style={{ fontSize: 12, color: '#2563eb' }}>Xem tất cả</Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    {['Mã', 'Người nhận', 'Tổng tiền', 'Phương thức', 'Trạng thái', 'Ngày đặt'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentOrders || []).length === 0
                    ? <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>Chưa có đơn hàng nào</td></tr>
                    : (data?.recentOrders || []).map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>#{o.id}</td>
                        <td style={{ padding: '10px 12px' }}>{o.receiverName}</td>
                        <td style={{ padding: '10px 12px', color: '#2563eb', fontWeight: 600 }}>{o.totalPrice?.toLocaleString('vi-VN')}₫</td>
                        <td style={{ padding: '10px 12px' }}>{o.paymentMethod || 'COD'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span className={`badge ${STATUS_BADGE[o.status] || 'badge-secondary'}`}>{STATUS_LABEL[o.status] || o.status}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                          {o.createdDate ? new Date(o.createdDate).toLocaleDateString('vi-VN') : ''}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { getAllOrders, updateOrderStatus } from '../../api/orders'
import { toast } from 'react-toastify'

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED']
const STATUS_LABEL = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy' }
const STATUS_BADGE = { PENDING: 'badge-warning', CONFIRMED: 'badge-info', SHIPPING: 'badge-info', DELIVERED: 'badge-success', CANCELLED: 'badge-danger' }

export default function OrdersPage() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [expanded, setExpanded] = useState(null)

  const load = () => {
    setLoading(true)
    getAllOrders({ page, size: 10 }).then(setData).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page])

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status)
      toast.success('Cập nhật trạng thái thành công!')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Thất bại') }
  }

  const orders = filterStatus
    ? (data.content || []).filter(o => o.status === filterStatus)
    : (data.content || [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý đơn hàng</h1>
        <select className="form-control" style={{ width: 200 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    {['Mã', 'Người nhận', 'SĐT', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày đặt', 'Thao tác'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0
                    ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Không có đơn hàng</td></tr>
                    : orders.map(o => (
                      <React.Fragment key={o.id}>
                        <tr style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                          onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>#{o.id}</td>
                          <td style={{ padding: '12px 14px' }}>{o.receiverName}</td>
                          <td style={{ padding: '12px 14px', color: '#6b7280' }}>{o.receiverPhone}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>{o.totalPrice?.toLocaleString('vi-VN')}₫</td>
                          <td style={{ padding: '12px 14px', color: '#6b7280' }}>{o.paymentMethod || 'COD'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className={`badge ${STATUS_BADGE[o.status] || 'badge-secondary'}`}>{STATUS_LABEL[o.status] || o.status}</span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {o.createdDate ? new Date(o.createdDate).toLocaleDateString('vi-VN') : ''}
                          </td>
                          <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                            <select
                              value={o.status}
                              onChange={e => handleStatusChange(o.id, e.target.value)}
                              style={{ fontSize: 12, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                            </select>
                          </td>
                        </tr>
                        {expanded === o.id && (
                          <tr style={{ background: '#f8fafc' }}>
                            <td colSpan={8} style={{ padding: '12px 24px' }}>
                              <p style={{ fontSize: 13, marginBottom: 8 }}><strong>Địa chỉ:</strong> {o.receiverAddress}</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {(o.items || []).map((item, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                                    <span style={{ fontWeight: 500 }}>{item.productName}</span>
                                    <span style={{ color: '#6b7280' }}>×{item.quantity}</span>
                                    <span style={{ color: '#2563eb', fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <i className="fa-solid fa-angle-left" />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button key={i} className={`page-btn ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button className="page-btn" disabled={page >= data.totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <i className="fa-solid fa-angle-right" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

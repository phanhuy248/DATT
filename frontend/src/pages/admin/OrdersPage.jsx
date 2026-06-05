import React, { useEffect, useState } from 'react'
import { getAllOrders, updateOrderStatus } from '../../api/orders'
import { approveBankTransfer, getPendingBankTransferOrders, rejectBankTransfer } from '../../api/payments'
import { toast } from 'react-toastify'

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED']
const STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Đã hoàn trả',
}
const STATUS_BADGE = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  PACKING: 'badge-info',
  SHIPPING: 'badge-info',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
  RETURNED: 'badge-secondary',
}
const PAYMENT_STATUS_LABEL = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Chờ xác nhận',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
}
const PAYMENT_STATUS_BADGE = {
  UNPAID: 'badge-secondary',
  PENDING: 'badge-warning',
  PAID: 'badge-success',
  FAILED: 'badge-danger',
  REFUNDED: 'badge-info',
}
const PAYMENT_METHOD_LABEL = {
  COD: 'COD',
  BANK_TRANSFER: 'Chuyển khoản QR',
  VNPAY: 'VNPAY',
  MOMO: 'MoMo',
}

export default function OrdersPage() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [bankPendingOnly, setBankPendingOnly] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [actionOrderId, setActionOrderId] = useState(null)

  const load = () => {
    setLoading(true)
    const request = bankPendingOnly
      ? getPendingBankTransferOrders().then(orders => ({ content: orders, totalPages: 1 }))
      : getAllOrders({ page, size: 10 })
    request.then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, bankPendingOnly])

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status)
      toast.success('Cập nhật trạng thái thành công!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thất bại')
    }
  }

  const handleApproveBankTransfer = async (orderId) => {
    setActionOrderId(orderId)
    try {
      await approveBankTransfer(orderId)
      toast.success('Đã xác nhận nhận tiền')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xác nhận chuyển khoản')
    } finally {
      setActionOrderId(null)
    }
  }

  const handleRejectBankTransfer = async (orderId) => {
    if (!window.confirm('Từ chối chuyển khoản và hủy đơn hàng này?')) return
    setActionOrderId(orderId)
    try {
      await rejectBankTransfer(orderId, 'Admin từ chối xác nhận chuyển khoản')
      toast.success('Đã từ chối và hủy đơn hàng')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể từ chối chuyển khoản')
    } finally {
      setActionOrderId(null)
    }
  }

  const orders = filterStatus
    ? (data.content || []).filter(o => o.status === filterStatus)
    : (data.content || [])

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý đơn hàng</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${bankPendingOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setBankPendingOnly(v => !v); setPage(0); setExpanded(null) }}
          >
            <i className="fa-solid fa-qrcode" />
            Chờ xác nhận CK
          </button>
          <select className="form-control" style={{ width: 200 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          <div className="card">
            <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="admin-table-card" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    {['Mã', 'Người nhận', 'SĐT', 'Tổng tiền', 'Thanh toán', 'TT thanh toán', 'Trạng thái', 'Ngày đặt', 'Thao tác'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0
                    ? <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Không có đơn hàng</td></tr>
                    : orders.map(o => {
                      const canReviewBankTransfer = o.paymentMethod === 'BANK_TRANSFER'
                        && o.paymentStatus === 'PENDING'
                        && o.status !== 'CANCELLED'
                      return (
                        <React.Fragment key={o.id}>
                          <tr style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                            onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                            <td data-label="Mã" style={{ padding: '12px 14px', fontWeight: 600 }}>#{o.id}</td>
                            <td data-label="Người nhận" style={{ padding: '12px 14px' }}>{o.receiverName}</td>
                            <td data-label="SĐT" style={{ padding: '12px 14px', color: '#6b7280' }}>{o.receiverPhone}</td>
                            <td data-label="Tổng tiền" style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>{o.totalPrice?.toLocaleString('vi-VN')}đ</td>
                            <td data-label="Thanh toán" style={{ padding: '12px 14px', color: '#6b7280' }}>{PAYMENT_METHOD_LABEL[o.paymentMethod] || o.paymentMethod || 'COD'}</td>
                            <td data-label="TT thanh toán" style={{ padding: '12px 14px' }}>
                              <span className={`badge ${PAYMENT_STATUS_BADGE[o.paymentStatus] || 'badge-secondary'}`}>{PAYMENT_STATUS_LABEL[o.paymentStatus] || o.paymentStatus}</span>
                            </td>
                            <td data-label="Trạng thái" style={{ padding: '12px 14px' }}>
                              <span className={`badge ${STATUS_BADGE[o.status] || 'badge-secondary'}`}>{STATUS_LABEL[o.status] || o.status}</span>
                            </td>
                            <td data-label="Ngày đặt" style={{ padding: '12px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                              {o.createdDate ? new Date(o.createdDate).toLocaleDateString('vi-VN') : ''}
                            </td>
                            <td data-label="Thao tác" style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                {canReviewBankTransfer && (
                                  <>
                                    <button
                                      className="btn btn-success btn-sm"
                                      disabled={actionOrderId === o.id}
                                      onClick={() => handleApproveBankTransfer(o.id)}
                                    >
                                      <i className="fa-solid fa-check" /> Nhận tiền
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      disabled={actionOrderId === o.id}
                                      onClick={() => handleRejectBankTransfer(o.id)}
                                    >
                                      <i className="fa-solid fa-xmark" /> Từ chối
                                    </button>
                                  </>
                                )}
                                <select
                                  value={o.status}
                                  onChange={e => handleStatusChange(o.id, e.target.value)}
                                  style={{ fontSize: 12, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
                                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                                </select>
                              </div>
                            </td>
                          </tr>
                          {expanded === o.id && (
                            <tr className="admin-expanded-row" style={{ background: '#f8fafc' }}>
                              <td className="admin-expanded-cell" colSpan={9} style={{ padding: '12px 24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12, fontSize: 13 }}>
                                  <p><strong>Địa chỉ:</strong> {o.receiverAddress}</p>
                                  <p><strong>Nội dung CK:</strong> {o.paymentMethod === 'BANK_TRANSFER' ? `DH${o.id}` : '-'}</p>
                                  <p><strong>Mã giao dịch:</strong> {o.transactionCode || '-'}</p>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                  {(o.items || []).map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                                      <span style={{ fontWeight: 500 }}>{item.productName}</span>
                                      <span style={{ color: '#6b7280' }}>x{item.quantity}</span>
                                      <span style={{ color: '#2563eb', fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {!bankPendingOnly && data.totalPages > 1 && (
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

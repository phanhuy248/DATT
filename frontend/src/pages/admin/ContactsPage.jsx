import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getContacts, markContactHandled } from '../../api/contacts'

export default function AdminContactsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    getContacts()
      .then(setItems)
      .catch(err => toast.error(err.response?.data?.message || 'Không thể tải liên hệ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleMarkHandled = async (item) => {
    try {
      const updated = await markContactHandled(item.id)
      setItems(prev => prev.map(row => row.id === item.id ? updated : row))
      setSelected(prev => prev?.id === item.id ? updated : prev)
      toast.success('Đã đánh dấu đã xử lý')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật liên hệ')
    }
  }

  const pendingCount = items.filter(item => !item.handled).length

  return (
    <div>
      <div className="admin-page-header flex-between" style={{ marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý liên hệ</h1>
          <p className="text-muted text-sm">{pendingCount} yêu cầu đang chờ xử lý.</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <i className="fa-solid fa-rotate" /> Tải lại
        </button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="card">
          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="admin-table-card" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Khách hàng', 'Chủ đề', 'Thời gian', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có liên hệ</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td data-label="Khách hàng" style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700 }}>{item.fullName || 'Khách hàng'}</div>
                      <div className="text-muted text-sm">{item.email}</div>
                      <div className="text-muted text-sm">{item.phone}</div>
                    </td>
                    <td data-label="Chủ đề" style={{ padding: '10px 14px', maxWidth: 360 }}>
                      <div style={{ fontWeight: 600 }}>{item.subject || 'Liên hệ SmartShop'}</div>
                      <div className="text-muted text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.message}</div>
                    </td>
                    <td data-label="Thời gian" style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td data-label="Trạng thái" style={{ padding: '10px 14px' }}>
                      <span className={`badge ${item.handled ? 'badge-success' : 'badge-warning'}`}>
                        {item.handled ? 'Đã xử lý' : 'Chờ xử lý'}
                      </span>
                    </td>
                    <td data-label="Thao tác" style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(item)}><i className="fa-solid fa-eye" /></button>
                        {!item.handled && <button className="btn btn-primary btn-sm" onClick={() => handleMarkHandled(item)}><i className="fa-solid fa-check" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 620 }}>
            <div className="card-body">
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.subject || 'Nội dung liên hệ'}</h2>
                <button onClick={() => setSelected(null)} style={{ border: 0, background: 'transparent', fontSize: 22, color: '#64748b' }}>×</button>
              </div>
              <div style={{ display: 'grid', gap: 8, marginBottom: 16, fontSize: 14 }}>
                <Row label="Họ tên" value={selected.fullName} />
                <Row label="Email" value={selected.email} />
                <Row label="Số điện thoại" value={selected.phone} />
                <Row label="Thời gian" value={selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'} />
              </div>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#334155' }}>
                {selected.message || 'Không có nội dung'}
              </div>
              <div className="admin-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Đóng</button>
                {!selected.handled && <button className="btn btn-primary" onClick={() => handleMarkHandled(selected)}><i className="fa-solid fa-check" /> Đánh dấu đã xử lý</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="admin-contact-row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
      <span className="text-muted">{label}</span>
      <span style={{ fontWeight: 600 }}>{value || '-'}</span>
    </div>
  )
}

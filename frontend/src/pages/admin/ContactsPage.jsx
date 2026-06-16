import React, { useEffect, useState } from 'react'
import { Check, Eye, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import { getContacts, markContactHandled } from '../../api/contacts'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Modal,
  PageHeader,
} from '../../components/admin/ui'

export default function AdminContactsPage() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    getContacts()
      .then(setItems)
      .catch((err) => toast.error(err.response?.data?.message || 'Không thể tải liên hệ'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleMarkHandled = async (item) => {
    try {
      const updated = await markContactHandled(item.id)
      setItems((prev) => prev.map((r) => (r.id === item.id ? updated : r)))
      setSelected((prev) => (prev?.id === item.id ? updated : prev))
      toast.success('Đã đánh dấu đã xử lý')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật liên hệ')
    }
  }

  const pendingCount = items.filter((i) => !i.handled).length

  const columns = [
    {
      key: 'fullName',
      header: 'Khách hàng',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.fullName || 'Khách hàng'}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
          {row.phone && <p className="text-xs text-gray-400">{row.phone}</p>}
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Chủ đề & Nội dung',
      className: 'max-w-sm',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.subject || 'Liên hệ SmartShop'}</p>
          <p className="mt-0.5 truncate text-xs text-gray-400">{row.message}</p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Thời gian',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-gray-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '—'}
        </span>
      ),
    },
    {
      key: 'handled',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.handled ? 'success' : 'warning'}>
          {row.handled ? 'Đã xử lý' : 'Chờ xử lý'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelected(row) }} title="Xem chi tiết">
            <Eye size={15} />
          </Button>
          {!row.handled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleMarkHandled(row) }}
              className="text-emerald-600 hover:bg-emerald-50"
              title="Đánh dấu đã xử lý"
            >
              <Check size={15} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Quản lý liên hệ"
        description={pendingCount > 0 ? `${pendingCount} yêu cầu đang chờ xử lý` : 'Tất cả đã được xử lý'}
        breadcrumb={[{ label: 'Admin' }, { label: 'Liên hệ' }]}
        actions={
          <Button variant="secondary" onClick={load}>
            <RefreshCw size={15} />
            Tải lại
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getKey={(r) => r.id}
          emptyMessage="Chưa có liên hệ"
          emptyDescription="Khi khách hàng gửi liên hệ, sẽ xuất hiện ở đây."
          emptyIcon={<Mail size={28} />}
          onRowClick={(row) => setSelected(row)}
        />
      </Card>

      {/* Detail drawer / modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.subject || 'Nội dung liên hệ'}
        width="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Đóng</Button>
            {selected && !selected.handled && (
              <Button onClick={() => handleMarkHandled(selected)}>
                <Check size={15} />
                Đánh dấu đã xử lý
              </Button>
            )}
          </>
        }
      >
        {selected && (
          <div className="flex flex-col gap-5">
            {/* Info rows */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-sm">
              <InfoRow label="Họ tên"        value={selected.fullName} />
              <InfoRow label="Email"          value={selected.email} />
              <InfoRow label="Số điện thoại" value={selected.phone} />
              <InfoRow
                label="Thời gian"
                value={selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '—'}
              />
            </div>

            {/* Message */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Nội dung</p>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                {selected.message || 'Không có nội dung'}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Trạng thái:</span>
              <Badge variant={selected.handled ? 'success' : 'warning'}>
                {selected.handled ? 'Đã xử lý' : 'Chờ xử lý'}
              </Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value || '—'}</p>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier } from '../../api/suppliers'
import {
  ActiveBadge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  PageHeader,
} from '../../components/admin/ui'

const EMPTY = { name: '', representativeName: '', email: '', phone: '', address: '', active: true }

export default function SuppliersPage() {
  const [items,    setItems]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [modal,    setModal]   = useState(null)
  const [form,     setForm]    = useState(EMPTY)
  const [saving,   setSaving]  = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const load = () => {
    setLoading(true)
    getSuppliers().then(setItems).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }) }
  const openEdit   = (s) => { setForm({ ...EMPTY, ...s }); setModal({ mode: 'edit', data: s }) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Tên nhà cung cấp không được để trống'); return }
    setSaving(true)
    try {
      modal.mode === 'create'
        ? await createSupplier(form)
        : await updateSupplier(modal.data.id, form)
      toast.success('Đã lưu nhà cung cấp')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteSupplier(toDelete.id)
      toast.success('Đã xóa nhà cung cấp')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa')
    } finally {
      setToDelete(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Tên nhà cung cấp',
      render: (row) => <span className="font-semibold text-gray-900">{row.name}</span>,
    },
    {
      key: 'representativeName',
      header: 'Đại diện',
      render: (row) => <span className="text-gray-500">{row.representativeName || '—'}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="text-gray-500">{row.email || '—'}</span>,
    },
    {
      key: 'phone',
      header: 'SĐT',
      render: (row) => <span className="text-gray-500">{row.phone || '—'}</span>,
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (row) => <ActiveBadge active={row.active} />,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(row) }} title="Chỉnh sửa">
            <Pencil size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); setToDelete(row) }}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            title="Xóa"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Quản lý nhà cung cấp"
        breadcrumb={[{ label: 'Admin' }, { label: 'Nhà cung cấp' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Thêm nhà cung cấp
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getKey={(r) => r.id}
          emptyMessage="Chưa có nhà cung cấp"
          emptyDescription="Thêm nhà cung cấp để liên kết với sản phẩm."
        />
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Thêm nhà cung cấp' : 'Chỉnh sửa nhà cung cấp'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
            <Button type="submit" form="sup-form" loading={saving}>Lưu</Button>
          </>
        }
      >
        <form id="sup-form" onSubmit={save} className="flex flex-col gap-4">
          <Input
            label="Tên nhà cung cấp"
            required
            autoFocus
            placeholder="Nhập tên..."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Người đại diện"
            placeholder="Nhập tên người đại diện..."
            value={form.representativeName}
            onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Số điện thoại"
              placeholder="0900 000 000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Input
            label="Địa chỉ"
            placeholder="Nhập địa chỉ..."
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Checkbox
            label="Đang hoạt động"
            checked={!!form.active}
            onChange={(v) => setForm({ ...form, active: v })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Xóa nhà cung cấp"
        description={`Bạn có chắc muốn xóa "${toDelete?.name}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
      />
    </div>
  )
}

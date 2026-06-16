import React, { useEffect, useState } from 'react'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { createCoupon, deleteCoupon, getCoupons, updateCoupon } from '../../api/coupons'
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
  Select,
} from '../../components/admin/ui'

const EMPTY = {
  code: '',
  description: '',
  discountType: 'FIXED',
  discountValue: '',
  minOrderAmount: 0,
  usageLimit: 0,
  active: true,
}

export default function CouponsPage() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const load = () => {
    setLoading(true)
    getCoupons().then(setItems).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }) }
  const openEdit   = (c) => { setForm({ ...c }); setModal({ mode: 'edit', data: c }) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.code.trim()) { toast.error('Mã giảm giá không được để trống'); return }
    setSaving(true)
    const data = {
      ...form,
      discountValue:  Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      usageLimit:     Number(form.usageLimit || 0),
    }
    try {
      modal.mode === 'create' ? await createCoupon(data) : await updateCoupon(modal.data.id, data)
      toast.success('Đã lưu mã giảm giá')
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
      await deleteCoupon(toDelete.id)
      toast.success('Đã xóa mã giảm giá')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa')
    } finally {
      setToDelete(null)
    }
  }

  const columns = [
    {
      key: 'code',
      header: 'Mã',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Tag size={13} />
          </div>
          <span className="font-mono font-bold text-gray-900">{row.code}</span>
        </div>
      ),
    },
    {
      key: 'discountType',
      header: 'Loại',
      render: (row) => (
        <span className="text-gray-600">
          {row.discountType === 'PERCENT' ? 'Phần trăm' : 'Giảm tiền'}
        </span>
      ),
    },
    {
      key: 'discountValue',
      header: 'Giá trị',
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {row.discountType === 'PERCENT'
            ? `${row.discountValue}%`
            : `${Number(row.discountValue).toLocaleString('vi-VN')}₫`}
        </span>
      ),
    },
    {
      key: 'minOrderAmount',
      header: 'Đơn tối thiểu',
      render: (row) => (
        <span className="text-gray-600">{Number(row.minOrderAmount || 0).toLocaleString('vi-VN')}₫</span>
      ),
    },
    {
      key: 'usedCount',
      header: 'Đã dùng',
      render: (row) => (
        <span className="text-gray-600">
          {row.usedCount ?? 0}/{row.usageLimit || '∞'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (row) => <ActiveBadge active={row.active} labelOn="Đang bật" labelOff="Tắt" />,
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
        title="Quản lý khuyến mãi"
        breadcrumb={[{ label: 'Admin' }, { label: 'Khuyến mãi' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Thêm mã
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getKey={(r) => r.id}
          emptyMessage="Chưa có mã giảm giá"
          emptyDescription="Tạo mã giảm giá để áp dụng cho đơn hàng."
          emptyIcon={<Tag size={28} />}
        />
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Thêm mã giảm giá' : 'Sửa mã giảm giá'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
            <Button type="submit" form="coupon-form" loading={saving}>Lưu</Button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={save} className="flex flex-col gap-4">
          <Input
            label="Mã giảm giá"
            required
            autoFocus
            placeholder="VD: SUMMER20"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
          <Input
            label="Mô tả"
            placeholder="Mô tả mã giảm giá..."
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Loại giảm"
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value })}
            >
              <option value="FIXED">Giảm tiền (₫)</option>
              <option value="PERCENT">Phần trăm (%)</option>
            </Select>
            <Input
              label={form.discountType === 'PERCENT' ? 'Giá trị (%)' : 'Giá trị (₫)'}
              type="number"
              required
              min={0}
              placeholder="0"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Đơn tối thiểu (₫)"
              type="number"
              min={0}
              placeholder="0"
              value={form.minOrderAmount || 0}
              onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
            />
            <Input
              label="Giới hạn lượt dùng"
              type="number"
              min={0}
              placeholder="0 = không giới hạn"
              value={form.usageLimit || 0}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            />
          </div>
          <Checkbox
            label="Đang bật"
            checked={!!form.active}
            onChange={(v) => setForm({ ...form, active: v })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Xóa mã giảm giá"
        description={`Bạn có chắc muốn xóa mã "${toDelete?.code}"?`}
        confirmLabel="Xóa"
      />
    </div>
  )
}

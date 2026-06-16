import React, { useEffect, useState } from 'react'
import { Image, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { createBanner, deleteBanner, getAdminBanners, updateBanner } from '../../api/banners'
import { getImageUrl } from '../../utils/image'
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
  Textarea,
} from '../../components/admin/ui'

const EMPTY = { title: '', subtitle: '', image: '', linkUrl: '/products', sortOrder: 0, active: true }

export default function AdminBannersPage() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [toDelete, setToDelete] = useState(null)

  const load = () => {
    setLoading(true)
    getAdminBanners()
      .then(setItems)
      .catch((err) => toast.error(err.response?.data?.message || 'Không thể tải banner'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }) }
  const openEdit   = (item) => { setForm({ ...EMPTY, ...item }); setModal({ mode: 'edit', data: item }) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề banner'); return }
    setSaving(true)
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder || 0) }
      if (modal.mode === 'create') await createBanner(payload)
      else await updateBanner(modal.data.id, payload)
      toast.success('Đã lưu banner')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu banner')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteBanner(toDelete.id)
      toast.success('Đã xóa banner')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa banner')
    } finally {
      setToDelete(null)
    }
  }

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const columns = [
    {
      key: 'image',
      header: 'Ảnh',
      headerClassName: 'w-32',
      render: (row) => (
        <div className="h-14 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {row.image
            ? <img src={getImageUrl(row.image)} alt="" className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center text-gray-300"><Image size={20} /></div>}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Nội dung',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.title}</p>
          {row.subtitle && <p className="mt-0.5 max-w-xs truncate text-xs text-gray-400">{row.subtitle}</p>}
        </div>
      ),
    },
    {
      key: 'linkUrl',
      header: 'Liên kết',
      render: (row) => <span className="text-blue-600 text-sm">{row.linkUrl || '—'}</span>,
    },
    {
      key: 'sortOrder',
      header: 'Thứ tự',
      headerClassName: 'w-20',
      render: (row) => <span className="text-gray-500">{row.sortOrder}</span>,
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (row) => <ActiveBadge active={row.active} labelOn="Hiển thị" labelOff="Ẩn" />,
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
        title="Quản lý banner"
        description="Điều khiển các banner hiển thị trên trang chủ."
        breadcrumb={[{ label: 'Admin' }, { label: 'Banner' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Thêm banner
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getKey={(r) => r.id}
          emptyMessage="Chưa có banner"
          emptyDescription="Thêm banner để hiển thị trên trang chủ."
          emptyIcon={<Image size={28} />}
        />
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Thêm banner' : 'Sửa banner'}
        width="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
            <Button type="submit" form="banner-form" loading={saving}>Lưu banner</Button>
          </>
        }
      >
        <form id="banner-form" onSubmit={save} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tiêu đề" required autoFocus placeholder="Nhập tiêu đề..." value={form.title} onChange={f('title')} />
            <Input label="Liên kết" placeholder="/products" value={form.linkUrl} onChange={f('linkUrl')} />
          </div>
          <Input label="URL ảnh" placeholder="https://... hoặc đường dẫn upload" value={form.image} onChange={f('image')} />
          {form.image && (
            <div className="h-28 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <img src={getImageUrl(form.image)} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <Textarea label="Mô tả ngắn" rows={2} placeholder="Mô tả banner..." value={form.subtitle} onChange={f('subtitle')} />
          <Input label="Thứ tự hiển thị" type="number" min={0} placeholder="0" value={form.sortOrder} onChange={f('sortOrder')} />
          <Checkbox
            label="Hiển thị banner"
            checked={!!form.active}
            onChange={(v) => setForm({ ...form, active: v })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Xóa banner"
        description={`Bạn có chắc muốn xóa banner "${toDelete?.title}"?`}
        confirmLabel="Xóa"
      />
    </div>
  )
}

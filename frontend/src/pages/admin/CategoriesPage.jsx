import React, { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../api/categories'
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  PageHeader,
  Textarea,
} from '../../components/admin/ui'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null) // null | { mode, data? }
  const [form,       setForm]       = useState({ name: '', description: '' })
  const [saving,     setSaving]     = useState(false)
  const [toDelete,   setToDelete]   = useState(null)

  const load = () => {
    setLoading(true)
    getCategories().then(setCategories).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ name: '', description: '' })
    setModal({ mode: 'create' })
  }
  const openEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '' })
    setModal({ mode: 'edit', data: cat })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Tên danh mục không được để trống'); return }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createCategory(form)
        toast.success('Tạo danh mục thành công!')
      } else {
        await updateCategory(modal.data.id, form)
        toast.success('Cập nhật danh mục thành công!')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteCategory(toDelete.id)
      toast.success('Đã xóa danh mục')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa')
    } finally {
      setToDelete(null)
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      headerClassName: 'w-16',
      render: (row) => <span className="text-xs text-gray-400">#{row.id}</span>,
    },
    {
      key: 'name',
      header: 'Tên danh mục',
      render: (row) => <span className="font-semibold text-gray-900">{row.name}</span>,
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (row) => <span className="text-gray-500">{row.description || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); openEdit(row) }}
            title="Chỉnh sửa"
          >
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
        title="Quản lý danh mục"
        breadcrumb={[{ label: 'Admin' }, { label: 'Danh mục' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Thêm danh mục
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={categories}
          loading={loading}
          getKey={(r) => r.id}
          emptyMessage="Chưa có danh mục"
          emptyDescription="Thêm danh mục đầu tiên để bắt đầu phân loại sản phẩm."
        />
      </Card>

      {/* Create / Edit modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Thêm danh mục' : 'Chỉnh sửa danh mục'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
            <Button type="submit" form="cat-form" loading={saving}>Lưu</Button>
          </>
        }
      >
        <form id="cat-form" onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Tên danh mục"
            required
            autoFocus
            placeholder="Nhập tên danh mục..."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            label="Mô tả"
            rows={3}
            placeholder="Nhập mô tả (tùy chọn)..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Xóa danh mục"
        description={`Bạn có chắc muốn xóa danh mục "${toDelete?.name}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
      />
    </div>
  )
}

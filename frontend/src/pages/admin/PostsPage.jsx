import React, { useEffect, useState } from 'react'
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { createPost, deletePost, getAdminPosts, updatePost } from '../../api/posts'
import {
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  PageHeader,
  PublishedBadge,
  Textarea,
} from '../../components/admin/ui'

const EMPTY = { title: '', slug: '', summary: '', content: '', thumbnail: '', published: true }

export default function AdminPostsPage() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const load = () => {
    setLoading(true)
    getAdminPosts().then(setItems).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }) }
  const openEdit   = (p) => { setForm({ ...EMPTY, ...p }); setModal({ mode: 'edit', data: p }) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Tiêu đề không được để trống'); return }
    setSaving(true)
    try {
      modal.mode === 'create'
        ? await createPost(form)
        : await updatePost(modal.data.id, form)
      toast.success('Đã lưu bài viết')
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
      await deletePost(toDelete.id)
      toast.success('Đã xóa bài viết')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa')
    } finally {
      setToDelete(null)
    }
  }

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const columns = [
    {
      key: 'thumbnail',
      header: 'Ảnh',
      headerClassName: 'w-20',
      render: (row) => (
        <div className="h-12 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {row.thumbnail
            ? <img src={row.thumbnail} alt="" className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center text-gray-300"><BookOpen size={16} /></div>}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Tiêu đề',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.title}</p>
          {row.slug && <p className="mt-0.5 text-xs text-gray-400">{row.slug}</p>}
        </div>
      ),
    },
    {
      key: 'summary',
      header: 'Tóm tắt',
      className: 'max-w-xs',
      render: (row) => (
        <span className="line-clamp-2 text-sm text-gray-500">{row.summary || '—'}</span>
      ),
    },
    {
      key: 'published',
      header: 'Trạng thái',
      render: (row) => <PublishedBadge published={row.published} />,
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
        title="Quản lý bài viết"
        breadcrumb={[{ label: 'Admin' }, { label: 'Bài viết' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Thêm bài viết
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getKey={(r) => r.id}
          emptyMessage="Chưa có bài viết"
          emptyDescription="Viết bài đầu tiên cho blog của bạn."
          emptyIcon={<BookOpen size={28} />}
        />
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Thêm bài viết' : 'Sửa bài viết'}
        width="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
            <Button type="submit" form="post-form" loading={saving}>Lưu</Button>
          </>
        }
      >
        <form id="post-form" onSubmit={save} className="flex flex-col gap-4">
          <Input label="Tiêu đề" required autoFocus placeholder="Nhập tiêu đề bài viết..." value={form.title || ''} onChange={f('title')} />
          <Input label="Slug" placeholder="duong-dan-bai-viet" value={form.slug || ''} onChange={f('slug')} hint="Để trống để tự sinh từ tiêu đề" />
          <Textarea label="Tóm tắt" rows={2} placeholder="Mô tả ngắn..." value={form.summary || ''} onChange={f('summary')} />
          <Textarea label="Nội dung" rows={8} placeholder="Nội dung bài viết..." value={form.content || ''} onChange={f('content')} />
          <Input label="URL ảnh thumbnail" placeholder="https://..." value={form.thumbnail || ''} onChange={f('thumbnail')} />
          <Checkbox
            label="Hiển thị bài viết"
            checked={!!form.published}
            onChange={(v) => setForm({ ...form, published: v })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Xóa bài viết"
        description={`Bạn có chắc muốn xóa bài viết "${toDelete?.title}"?`}
        confirmLabel="Xóa"
      />
    </div>
  )
}

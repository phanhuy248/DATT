import React, { useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2, User } from 'lucide-react'
import { toast } from 'react-toastify'
import { createUser, deleteUser, getAllUsers, updateUser } from '../../api/users'
import { useAuth } from '../../context/AuthContext'
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
  RoleBadge,
  Select,
} from '../../components/admin/ui'

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users,    setUsers]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [error,    setError]   = useState('')
  const [search,   setSearch]  = useState('')
  const [modal,    setModal]   = useState(null)
  const [form,     setForm]    = useState({ email: '', password: '', fullName: '', address: '', phone: '', role: 'USER', active: true })
  const [saving,   setSaving]  = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    getAllUsers()
      .then(setUsers)
      .catch((err) => {
        const msg = err.response?.data?.message || 'Không thể tải danh sách người dùng'
        setUsers([])
        setError(msg)
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ email: '', password: '', fullName: '', address: '', phone: '', role: 'USER', active: true })
    setModal({ mode: 'create' })
  }
  const openEdit = (u) => {
    setForm({ email: u.email, password: '', fullName: u.fullName, address: u.address || '', phone: u.phone || '', role: u.role || 'USER', active: u.active !== false })
    setModal({ mode: 'edit', data: u })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createUser(form)
      } else {
        const payload = { ...form, password: form.password || null }
        await updateUser(modal.data.id, payload)
      }
      toast.success('Đã lưu tài khoản')
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
    setDeleting(true)
    try {
      await deleteUser(toDelete.id)
      toast.success('Đã xóa người dùng')
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = users.filter((u) =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'id',
      header: 'ID',
      headerClassName: 'w-14',
      render: (row) => <span className="text-xs text-gray-400">#{row.id}</span>,
    },
    {
      key: 'fullName',
      header: 'Họ tên',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-blue-50">
            {row.avatar
              ? <img src={getImageUrl(row.avatar)} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-blue-500"><User size={14} /></div>}
          </div>
          <span className="font-semibold text-gray-900">{row.fullName}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="text-gray-500">{row.email}</span>,
    },
    {
      key: 'phone',
      header: 'Điện thoại',
      render: (row) => <span className="text-gray-500">{row.phone || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (row) => <RoleBadge role={row.role || 'USER'} />,
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (row) => <ActiveBadge active={row.active !== false} />,
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
            disabled={row.id === me?.id}
            onClick={(e) => {
              e.stopPropagation()
              if (row.id === me?.id) { toast.error('Không thể xóa tài khoản đang đăng nhập'); return }
              setToDelete(row)
            }}
            className="text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
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
        title="Quản lý người dùng"
        breadcrumb={[{ label: 'Admin' }, { label: 'Người dùng' }]}
        actions={
          <>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D70018]/30"
              />
            </div>
            <Button onClick={openCreate}>
              <Plus size={16} />
              Thêm người dùng
            </Button>
          </>
        }
      />

      {error ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-4 text-sm text-gray-600">{error}</p>
          <Button variant="secondary" size="sm" onClick={load}>Thử lại</Button>
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            getKey={(r) => r.id}
            emptyMessage="Không tìm thấy người dùng"
          />
          {!loading && filtered.length > 0 && (
            <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
              Tổng: {filtered.length} người dùng
            </p>
          )}
        </Card>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Thêm tài khoản' : 'Chỉnh sửa tài khoản'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
            <Button type="submit" form="user-form" loading={saving}>Lưu</Button>
          </>
        }
      >
        <form id="user-form" onSubmit={save} className="flex flex-col gap-4">
          <Input label="Email" type="email" required placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Họ tên" required placeholder="Nhập họ tên..." value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Số điện thoại" placeholder="0900 000 000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select label="Vai trò" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="USER">USER</option>
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </div>
          <Input label="Địa chỉ" placeholder="Nhập địa chỉ..." value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input
            label={modal?.mode === 'edit' ? 'Mật khẩu (để trống nếu không đổi)' : 'Mật khẩu'}
            type="password"
            placeholder="••••••••"
            required={modal?.mode === 'create'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Checkbox label="Tài khoản đang hoạt động" checked={!!form.active} onChange={(v) => setForm({ ...form, active: v })} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={handleDelete}
        title="Xóa tài khoản"
        description={`Bạn có chắc muốn xóa tài khoản "${toDelete?.email}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={deleting}
      />
    </div>
  )
}

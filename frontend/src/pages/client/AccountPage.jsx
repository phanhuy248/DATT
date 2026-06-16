import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Receipt, Save, User } from 'lucide-react'
import { toast } from 'react-toastify'
import { updateProfile, uploadAvatar } from '../../api/users'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import { useAuth } from '../../context/AuthContext'
import { getImageUrl } from '../../utils/image'
import { validateFullName, validatePhone, validateAddress, buildErrors } from '../../utils/validators'

export default function AccountPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: user?.fullName || '', address: user?.address || '', phone: user?.phone || '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const validate = () => buildErrors({
    fullName: validateFullName(form.fullName),
    phone: validatePhone(form.phone),
    address: validateAddress(form.address),
  })

  const handleSave = async (event) => {
    event.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    try {
      const updated = await updateProfile(form)
      updateUser(updated)
      toast.success('Cập nhật thành công')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const updated = await uploadAvatar(file)
      updateUser(updated)
      toast.success('Cập nhật ảnh thành công')
    } catch {
      toast.error('Không thể tải ảnh lên')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-5 lg:px-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <SectionHeader title="Tài khoản của tôi" subtitle="Quản lý thông tin nhận hàng và ảnh đại diện" />
        <Button to="/orders" variant="secondary">
          <Receipt className="h-4 w-4" />
          Đơn hàng
        </Button>
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
          <h2 className="mb-5 text-base font-bold text-shop-text">Ảnh đại diện</h2>
          <div className="account-avatar-row flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-shop-softBlue text-shop-red">
              {user?.avatar ? <img src={getImageUrl(user.avatar)} alt="" className="h-full w-full object-cover" /> : <User className="h-8 w-8" />}
            </div>
            <div>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-shop-border bg-shop-surface px-4 text-sm font-bold text-shop-text transition hover:border-shop-red hover:text-shop-red">
                <Camera className="h-4 w-4" />
                {uploading ? 'Đang tải...' : 'Đổi ảnh'}
                <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
              </label>
              <p className="mt-2 text-xs font-medium text-shop-muted">PNG, JPG tối đa 5MB</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
          <h2 className="mb-5 text-base font-bold text-shop-text">Thông tin tài khoản</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input className="form-control bg-shop-bg text-shop-muted" value={user?.email || ''} disabled />
            </Field>
            <Field label="Vai trò">
              <input className="form-control bg-shop-bg text-shop-muted" value={user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'} disabled />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
          <h2 className="mb-5 text-base font-bold text-shop-text">Chỉnh sửa thông tin nhận hàng</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Họ và tên" error={errors.fullName}>
              <input className="form-control" placeholder="Nguyễn Văn A" value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            </Field>
            <Field label="Số điện thoại" error={errors.phone}>
              <input className="form-control" placeholder="0912 345 678" value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </Field>
            <Field label="Địa chỉ" error={errors.address}>
              <textarea className="form-control" rows={3} placeholder="123 Đường ABC, Quận 1, TP.HCM"
                value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </Field>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </form>
        </section>

        <p className="text-center text-xs font-medium text-shop-muted">
          Cần hỗ trợ tài khoản? <Link to="/info/contact" className="font-bold text-shop-red">Liên hệ SMARTSHOP</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      {children}
      {error && <p className="form-error">{error}</p>}
    </label>
  )
}

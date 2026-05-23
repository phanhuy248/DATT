import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

const initialForm = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  address: '',
  phone: '',
}

export default function RegisterPage() {
  const { requestRegistrationOtp, verifyRegistrationOtp, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('form')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.fullName || form.fullName.trim().length < 3) e.fullName = 'Họ tên ít nhất 3 ký tự'
    if (!form.email) e.email = 'Email không được để trống'
    else if (!/^[^\s@]+@gmail\.com$/i.test(form.email.trim())) e.email = 'Vui lòng dùng địa chỉ Gmail'
    if (!form.password || form.password.length < 6) e.password = 'Mật khẩu ít nhất 6 ký tự'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu xác nhận không khớp'
    if (!form.phone) e.phone = 'Số điện thoại không được để trống'
    if (!form.address) e.address = 'Địa chỉ không được để trống'
    return e
  }

  const registrationPayload = () => ({
    email: form.email.trim(),
    password: form.password,
    fullName: form.fullName.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
  })

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    try {
      await requestRegistrationOtp(registrationPayload())
      setErrors({})
      setStep('otp')
      toast.success('Mã OTP đã được gửi đến Gmail của bạn')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi mã OTP')
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp.trim())) {
      setErrors({ otp: 'Mã OTP phải gồm 6 chữ số' })
      return
    }

    try {
      await verifyRegistrationOtp(form.email.trim(), otp.trim())
      toast.success('Đăng ký thành công!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã OTP không hợp lệ')
    }
  }

  const handleResendOtp = async () => {
    try {
      await requestRegistrationOtp(registrationPayload())
      setOtp('')
      toast.success('Đã gửi lại mã OTP')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại mã OTP')
    }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-control"
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        disabled={step === 'otp' || loading}
      />
      {errors[key] && <p className="form-error">{errors[key]}</p>}
    </div>
  )

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <i className="fa-solid fa-bolt" style={{ fontSize: 32, color: '#2563eb', marginBottom: 8 }} />
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>
                {step === 'form' ? 'Tạo tài khoản' : 'Xác nhận Gmail'}
              </h1>
              {step === 'otp' && (
                <p className="text-muted text-sm mt-1" style={{ margin: 0 }}>
                  Nhập mã 6 số đã gửi đến {form.email}
                </p>
              )}
            </div>

            {step === 'form' ? (
              <form onSubmit={handleRequestOtp}>
                {field('fullName', 'Họ và tên', 'text', 'Nguyễn Văn A')}
                {field('email', 'Gmail', 'email', 'your@gmail.com')}
                {field('password', 'Mật khẩu', 'password', '••••••')}
                {field('confirmPassword', 'Xác nhận mật khẩu', 'password', '••••••')}
                {field('phone', 'Số điện thoại', 'tel', '0912345678')}
                {field('address', 'Địa chỉ', 'text', '123 Đường ABC, TP.HCM')}
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Đang gửi mã...</> : 'Gửi mã OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label">Mã OTP</label>
                  <input
                    className="form-control"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={loading}
                    autoFocus
                    style={{ textAlign: 'center', letterSpacing: 4, fontSize: 20, fontWeight: 700 }}
                  />
                  {errors.otp && <p className="form-error">{errors.otp}</p>}
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Đang xác nhận...</> : 'Xác nhận và đăng ký'}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 14 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep('form')} disabled={loading}>
                    Sửa thông tin
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleResendOtp} disabled={loading}>
                    Gửi lại mã
                  </button>
                </div>
              </form>
            )}

            <p className="text-sm text-muted mt-4" style={{ textAlign: 'center' }}>
              Đã có tài khoản? <Link to="/login" style={{ color: '#2563eb', fontWeight: 500 }}>Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

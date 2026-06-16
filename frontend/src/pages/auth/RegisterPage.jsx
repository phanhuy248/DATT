import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import BrandLogo from '../../components/common/BrandLogo'
import { validateFullName, validateGmail, validatePassword, validateConfirmPassword, validatePhone, validateAddress, buildErrors } from '../../utils/validators'

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

  const validate = () => buildErrors({
    fullName: validateFullName(form.fullName),
    email: validateGmail(form.email),
    password: validatePassword(form.password),
    confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    phone: validatePhone(form.phone),
    address: validateAddress(form.address),
  })

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

  const field = (key, label, type = 'text', placeholder = '') => {
    const fieldId = `register-${key}`
    return (
      <div className="form-group">
        <label htmlFor={fieldId} className="form-label">{label}</label>
        <input
          id={fieldId}
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
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="mb-3 flex justify-center">
                <BrandLogo iconClassName="h-12 w-12 rounded-2xl" textClassName="text-2xl" />
              </div>
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
                  <label htmlFor="register-otp" className="form-label">Mã OTP</label>
                  <input
                    id="register-otp"
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
              Đã có tài khoản? <Link to="/login" style={{ color: '#D70018', fontWeight: 700 }}>Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

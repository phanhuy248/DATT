import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyPasswordResetOtp, resetPassword } from '../../api/auth'
import { toast } from 'react-toastify'
import BrandLogo from '../../components/common/BrandLogo'

const STEP_EMAIL = 1
const STEP_OTP = 2
const STEP_NEW_PASSWORD = 3

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(STEP_EMAIL)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})

  const handleSendOtp = async e => {
    e.preventDefault()
    const errs = {}
    if (!email) errs.email = 'Email không được để trống'
    if (errs.email) { setErrors(errs); return }
    setLoading(true)
    try {
      await forgotPassword(email.trim())
      toast.success('Mã OTP đã được gửi đến email của bạn!')
      setErrors({})
      setStep(STEP_OTP)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi mã OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async e => {
    e.preventDefault()
    const errs = {}
    if (!otp) errs.otp = 'Vui lòng nhập mã OTP'
    else if (!/^\d{6}$/.test(otp)) errs.otp = 'Mã OTP phải gồm 6 chữ số'
    if (errs.otp) { setErrors(errs); return }
    setLoading(true)
    try {
      const data = await verifyPasswordResetOtp(email.trim(), otp.trim())
      setResetToken(data.resetToken)
      setErrors({})
      setStep(STEP_NEW_PASSWORD)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async e => {
    e.preventDefault()
    const errs = {}
    if (!newPassword) errs.newPassword = 'Mật khẩu không được để trống'
    else if (newPassword.length < 6) errs.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự'
    if (!confirmPassword) errs.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await resetPassword(resetToken, newPassword)
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    try {
      await forgotPassword(email.trim())
      toast.success('Mã OTP mới đã được gửi đến email của bạn!')
      setOtp('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại mã OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="card">
          <div className="card-body">

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="mb-3 flex justify-center">
                <BrandLogo iconClassName="h-12 w-12 rounded-2xl" textClassName="text-2xl" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quên mật khẩu</h1>
              <p className="text-muted text-sm mt-1">
                {step === STEP_EMAIL && 'Nhập email để nhận mã OTP'}
                {step === STEP_OTP && 'Nhập mã OTP đã gửi đến email'}
                {step === STEP_NEW_PASSWORD && 'Tạo mật khẩu mới'}
              </p>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              {[STEP_EMAIL, STEP_OTP, STEP_NEW_PASSWORD].map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: step >= s ? '#D70018' : '#E5E7EB',
                    color: step >= s ? '#fff' : '#4B5563',
                  }}>{s}</div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: step > s ? '#D70018' : '#E5E7EB', maxWidth: 40 }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 1: Email */}
            {step === STEP_EMAIL && (
              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label htmlFor="forgot-email" className="form-label">Email</label>
                  <input id="forgot-email" type="email" className="form-control" placeholder="your@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Đang gửi...</> : 'Gửi mã OTP'}
                </button>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === STEP_OTP && (
              <form onSubmit={handleVerifyOtp}>
                <p className="text-sm text-muted mb-3" style={{ textAlign: 'center' }}>
                  Mã OTP đã gửi đến <strong>{email}</strong>
                </p>
                <div className="form-group">
                  <label htmlFor="forgot-otp" className="form-label">Mã OTP (6 chữ số)</label>
                  <input id="forgot-otp" type="text" className="form-control" placeholder="123456" maxLength={6}
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus
                    style={{ fontSize: 20, letterSpacing: 8, textAlign: 'center' }} />
                  {errors.otp && <p className="form-error">{errors.otp}</p>}
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Đang xác thực...</> : 'Xác nhận OTP'}
                </button>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button type="button" className="btn" onClick={handleResendOtp} disabled={loading}
                    style={{ background: 'none', color: '#D70018', fontWeight: 600, padding: '4px 0', fontSize: 13 }}>
                    Gửi lại mã OTP
                  </button>
                  <span style={{ margin: '0 8px', color: '#4B5563' }}>|</span>
                  <button type="button" className="btn" onClick={() => setStep(STEP_EMAIL)}
                    style={{ background: 'none', color: '#4B5563', padding: '4px 0', fontSize: 13 }}>
                    Đổi email
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: New password */}
            {step === STEP_NEW_PASSWORD && (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="forgot-new-password" className="form-label">Mật khẩu mới</label>
                  <input id="forgot-new-password" type="password" className="form-control" placeholder="Ít nhất 6 ký tự"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
                  {errors.newPassword && <p className="form-error">{errors.newPassword}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="forgot-confirm-password" className="form-label">Xác nhận mật khẩu</label>
                  <input id="forgot-confirm-password" type="password" className="form-control" placeholder="Nhập lại mật khẩu"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Đang lưu...</> : 'Đặt lại mật khẩu'}
                </button>
              </form>
            )}

            <p className="text-sm text-muted mt-4" style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#4B5563' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: 4 }} />
                Quay lại đăng nhập
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}

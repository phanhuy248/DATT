// Số điện thoại Việt Nam hợp lệ:
// - 10 chữ số, bắt đầu bằng 0
// - Đầu số hợp lệ: 03x, 05x, 07x, 08x, 09x
// - Hỗ trợ cả dạng +84
const VN_PHONE_RE = /^(0[35789]\d{8}|\+84[35789]\d{8})$/

export function validatePhone(value) {
  const phone = (value || '').replace(/[\s\-\.]/g, '')
  if (!phone) return 'Số điện thoại không được để trống'
  if (!VN_PHONE_RE.test(phone)) return 'Số điện thoại không hợp lệ (VD: 0912 345 678)'
  return null
}

// Họ tên: chỉ chứa chữ cái (kể cả tiếng Việt), khoảng trắng, dấu gạch ngang
const FULL_NAME_RE = /^[\p{L}\s'-]+$/u

export function validateFullName(value) {
  const name = (value || '').trim()
  if (!name) return 'Họ và tên không được để trống'
  if (name.length < 2) return 'Họ và tên ít nhất 2 ký tự'
  if (name.length > 100) return 'Họ và tên không được vượt quá 100 ký tự'
  if (!FULL_NAME_RE.test(name)) return 'Họ và tên không được chứa số hoặc ký tự đặc biệt'
  return null
}

export function validateEmail(value) {
  const email = (value || '').trim()
  if (!email) return 'Email không được để trống'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ'
  return null
}

export function validateGmail(value) {
  const email = (value || '').trim()
  if (!email) return 'Email không được để trống'
  if (!/^[^\s@]+@gmail\.com$/i.test(email)) return 'Vui lòng dùng địa chỉ Gmail (@gmail.com)'
  return null
}

export function validatePassword(value) {
  if (!value) return 'Mật khẩu không được để trống'
  if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự'
  return null
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Vui lòng xác nhận mật khẩu'
  if (password !== confirm) return 'Mật khẩu xác nhận không khớp'
  return null
}

export function validateAddress(value) {
  const addr = (value || '').trim()
  if (!addr) return 'Địa chỉ không được để trống'
  if (addr.length < 5) return 'Địa chỉ quá ngắn'
  return null
}

// Trả về object errors từ map { field: validateFn() }
export function buildErrors(checks) {
  const errors = {}
  for (const [field, msg] of Object.entries(checks)) {
    if (msg) errors[field] = msg
  }
  return errors
}

import api from './axios'

const backendBaseUrl = () =>
  (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '')

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data.data)

export const register = (data) =>
  api.post('/auth/register', data).then(r => r.data.data)

export const requestRegistrationOtp = (data) =>
  api.post('/auth/register/request-otp', data).then(r => r.data)

export const verifyRegistrationOtp = (email, otp) =>
  api.post('/auth/register/verify-otp', { email, otp }).then(r => r.data.data)

export const completeGoogleProfile = (data) =>
  api.post('/auth/oauth2/complete-profile', data).then(r => r.data.data)

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then(r => r.data)

export const verifyPasswordResetOtp = (email, otp) =>
  api.post('/auth/forgot-password/verify-otp', { email, otp }).then(r => r.data.data)

export const resetPassword = (token, newPassword) =>
  api.post('/auth/reset-password', { token, newPassword }).then(r => r.data)

export const logout = (refreshToken) =>
  api.post('/auth/logout', { refreshToken }).then(r => r.data)

export const getGoogleLoginUrl = () =>
  `${backendBaseUrl()}/oauth2/authorization/google`

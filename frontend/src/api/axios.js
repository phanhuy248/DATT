import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise = null
// Tăng mỗi khi đăng xuất để vô hiệu hoá các request cũ đang chờ
let sessionVersion = 0

export const invalidateSession = () => {
  sessionVersion++
  refreshPromise = null
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Gắn phiên hiện tại vào request để kiểm tra khi response về
  config._sessionVersion = sessionVersion
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config || {}
    const requestUrl = error.config?.url || ''
    const requestSession = originalRequest._sessionVersion ?? sessionVersion

    const isAuthRequest = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/refresh-token')
      || requestUrl.includes('/auth/logout')

    const isAdminPage = window.location.pathname.startsWith('/admin')

    // Bỏ qua response của phiên cũ (đã đăng xuất) – tránh xoá token phiên mới
    if (requestSession !== sessionVersion) {
      return Promise.reject(error)
    }

    if (status === 401 && !isAuthRequest && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        originalRequest._retry = true
        try {
          if (!refreshPromise) {
            refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken })
              .then((r) => r.data.data)
              .finally(() => {
                refreshPromise = null
              })
          }
          const data = await refreshPromise
          // Kiểm tra lại phiên sau khi await – user có thể đã đăng xuất trong lúc chờ
          if (requestSession !== sessionVersion) {
            return Promise.reject(error)
          }
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          localStorage.setItem('user', JSON.stringify(data.user))
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        } catch (_) {
          if (requestSession !== sessionVersion) {
            return Promise.reject(error)
          }
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = isAdminPage ? '/admin/login' : '/login'
          return Promise.reject(error)
        }
      }
    }

    if ((status === 401 || status === 403) && !isAuthRequest) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = isAdminPage ? '/admin/login' : '/login'
    }
    return Promise.reject(error)
  }
)

export default api

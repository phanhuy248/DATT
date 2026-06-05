import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise = null

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Let the browser set Content-Type with boundary automatically for FormData
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
    const isAuthRequest = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/refresh-token')
    const isAdminPage = window.location.pathname.startsWith('/admin')

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
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          localStorage.setItem('user', JSON.stringify(data.user))
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        } catch (_) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = isAdminPage ? '/admin/login' : '/login'
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

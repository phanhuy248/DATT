import api from './axios'

export const placeOrder = (data, idempotencyKey) =>
  api.post('/orders', data, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}).then(r => r.data.data)
export const getMyOrders = () => api.get('/orders/my').then(r => r.data.data)
export const getMyOrder = (id) => api.get(`/orders/my/${id}`).then(r => r.data.data)
export const cancelMyOrder = (id) => api.post(`/orders/my/${id}/cancel`).then(r => r.data.data)
export const getAllOrders = (params) => api.get('/orders', { params }).then(r => r.data.data)
export const updateOrderStatus = (id, status, note) =>
  api.put(`/orders/${id}/status`, { status, ...(note ? { note } : {}) }).then(r => r.data.data)
export const changePaymentMethod = (id, method) =>
  api.put(`/orders/my/${id}/payment-method`, { method }).then(r => r.data.data)
export const getDashboard = () => api.get('/admin/dashboard').then(r => r.data.data)

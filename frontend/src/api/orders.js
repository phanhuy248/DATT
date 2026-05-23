import api from './axios'

export const placeOrder = (data) => api.post('/orders', data).then(r => r.data.data)
export const getMyOrders = () => api.get('/orders/my').then(r => r.data.data)
export const getMyOrder = (id) => api.get(`/orders/my/${id}`).then(r => r.data.data)
export const getAllOrders = (params) => api.get('/orders', { params }).then(r => r.data.data)
export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status }).then(r => r.data.data)
export const getDashboard = () => api.get('/admin/dashboard').then(r => r.data.data)

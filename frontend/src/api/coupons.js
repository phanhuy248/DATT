import api from './axios'

export const getCoupons = () => api.get('/coupons').then(r => r.data.data)
export const createCoupon = (data) => api.post('/coupons', data).then(r => r.data.data)
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data).then(r => r.data.data)
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`).then(r => r.data)
export const validateCoupon = (code, orderAmount) =>
  api.post('/coupons/validate', { code, orderAmount }).then(r => r.data.data)

import api from './axios'

export const getActiveFlashSales = () =>
  api.get('/products/flash-sale').then(r => r.data.data)

export const getAdminFlashSales = (params) =>
  api.get('/admin/flash-sales', { params }).then(r => r.data.data)

export const createFlashSale = (data) =>
  api.post('/admin/flash-sales', data).then(r => r.data.data)

export const updateFlashSale = (id, data) =>
  api.put(`/admin/flash-sales/${id}`, data).then(r => r.data.data)

export const deleteFlashSale = (id) =>
  api.delete(`/admin/flash-sales/${id}`).then(r => r.data)

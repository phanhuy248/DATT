import api from './axios'

export const getProducts = (params) =>
  api.get('/products', { params }).then(r => r.data.data)

export const getProduct = (id) =>
  api.get(`/products/${id}`).then(r => r.data.data)

export const getRelatedProducts = (id, limit = 8) =>
  api.get(`/products/${id}/related`, { params: { limit } }).then(r => r.data.data)

export const getPriceHistory = (id) =>
  api.get(`/products/${id}/price-history`).then(r => r.data.data)

export const createProduct = (formData) =>
  api.post('/products', formData).then(r => r.data.data)

export const updateProduct = (id, formData) =>
  api.put(`/products/${id}`, formData).then(r => r.data.data)

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then(r => r.data)

export const restoreProduct = (id) =>
  api.patch(`/products/${id}/restore`).then(r => r.data.data)

export const toggleProductActive = (id) =>
  api.patch(`/products/${id}/toggle-active`).then(r => r.data.data)

export const importStock = (id, data) =>
  api.post(`/products/${id}/stock-import`, data).then(r => r.data.data)

export const importProductsJson = (data) =>
  api.post('/admin/import-products', data).then(r => r.data.data)

import api from './axios'

export const getSuppliers = () => api.get('/suppliers').then(r => r.data.data)
export const createSupplier = (data) => api.post('/suppliers', data).then(r => r.data.data)
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data).then(r => r.data.data)
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`).then(r => r.data)

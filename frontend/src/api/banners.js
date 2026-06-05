import api from './axios'

export const getActiveBanners = () =>
  api.get('/banners').then(r => r.data.data)

export const getAdminBanners = () =>
  api.get('/banners/admin/all').then(r => r.data.data)

export const createBanner = (data) =>
  api.post('/banners', data).then(r => r.data.data)

export const updateBanner = (id, data) =>
  api.put(`/banners/${id}`, data).then(r => r.data.data)

export const deleteBanner = (id) =>
  api.delete(`/banners/${id}`).then(r => r.data)

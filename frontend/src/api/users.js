import api from './axios'

export const getMe = () => api.get('/users/me').then(r => r.data.data)
export const updateProfile = (data) => api.put('/users/me', data).then(r => r.data.data)
export const uploadAvatar = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data)
}
export const getAllUsers = () => api.get('/users').then(r => r.data.data)
export const createUser = (data) => api.post('/users', data).then(r => r.data.data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data).then(r => r.data.data)
export const deleteUser = (id) => api.delete(`/users/${id}`).then(r => r.data)

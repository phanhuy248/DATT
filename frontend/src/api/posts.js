import api from './axios'

export const getPosts = () => api.get('/posts').then(r => r.data.data)
export const getPost = (slug) => api.get(`/posts/${slug}`).then(r => r.data.data)
export const getAdminPosts = () => api.get('/posts/admin/all').then(r => r.data.data)
export const createPost = (data) => api.post('/posts', data).then(r => r.data.data)
export const updatePost = (id, data) => api.put(`/posts/${id}`, data).then(r => r.data.data)
export const deletePost = (id) => api.delete(`/posts/${id}`).then(r => r.data)

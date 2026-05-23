import api from './axios'

export const getCart = () => api.get('/cart').then(r => r.data.data)
export const addToCart = (productId, quantity) =>
  api.post('/cart', { productId, quantity }).then(r => r.data.data)
export const updateCartItem = (cartItemId, quantity) =>
  api.put(`/cart/${cartItemId}`, { quantity }).then(r => r.data.data)
export const removeCartItem = (cartItemId) =>
  api.delete(`/cart/${cartItemId}`).then(r => r.data.data)
export const clearCart = () => api.delete('/cart').then(r => r.data)

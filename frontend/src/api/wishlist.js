import api from './axios'

export const toggleWishlist = (productId) =>
  api.post(`/wishlist/toggle/${productId}`).then(r => r.data)

export const getWishlist = () =>
  api.get('/wishlist').then(r => r.data.data)

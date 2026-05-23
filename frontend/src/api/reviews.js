import api from './axios'

export const getReviews = (productId) =>
  api.get(`/reviews/product/${productId}`).then(r => r.data.data)

export const addReview = (data) =>
  api.post('/reviews', data).then(r => r.data.data)

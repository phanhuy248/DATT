import api from './axios'

export const createVnpayPayment = (orderId) =>
  api.post(`/payments/vnpay/orders/${orderId}`).then(r => r.data.data)

export const getBankTransferPaymentInfo = (orderId) =>
  api.get(`/payments/bank-transfer/orders/${orderId}`).then(r => r.data.data)

import api from './axios'

export const createVnpayPayment = (orderId) =>
  api.post(`/payments/vnpay/orders/${orderId}`).then(r => r.data.data)

export const getBankTransferPaymentInfo = (orderId) =>
  api.get(`/payments/bank-transfer/orders/${orderId}`).then(r => r.data.data)

export const confirmBankTransfer = (orderId) =>
  api.post(`/payments/bank-transfer/orders/${orderId}/customer-confirm`).then(r => r.data.data)

export const getPendingBankTransferOrders = () =>
  api.get('/payments/bank-transfer/pending').then(r => r.data.data)

export const approveBankTransfer = (orderId) =>
  api.post(`/payments/bank-transfer/orders/${orderId}/approve`).then(r => r.data.data)

export const rejectBankTransfer = (orderId, note) =>
  api.post(`/payments/bank-transfer/orders/${orderId}/reject`, { note }).then(r => r.data.data)

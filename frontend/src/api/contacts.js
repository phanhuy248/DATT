import api from './axios'

export const createContact = (data) =>
  api.post('/contacts', data).then(r => r.data.data)

export const getContacts = () =>
  api.get('/contacts').then(r => r.data.data)

export const markContactHandled = (id) =>
  api.put(`/contacts/${id}/handled`).then(r => r.data.data)

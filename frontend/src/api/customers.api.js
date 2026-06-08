import api from './axios.config';
export const customersAPI = {
  getAll: (params) => api.get('/users/customers', { params }),
  getOne: (id) => api.get(`/users/customers/${id}`),
  create: (data) => api.post('/users/customers', data),
  update: (id, data) => api.put(`/users/customers/${id}`, data),
  delete: (id) => api.delete(`/users/customers/${id}`),
};

import api from './axios.config';
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getOne: (id) => api.get(`/payments/${id}`),
  getStats: (params) => api.get('/payments/stats', { params }),
  process: (data) => api.post('/payments/process', data),
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
};

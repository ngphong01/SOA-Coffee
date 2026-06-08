import api from './axios.config';
export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  getAllPOs: (params) => api.get('/suppliers/purchase-orders', { params }),
  createPO: (data) => api.post('/suppliers/purchase-orders', data),
  updatePOStatus: (id, data) => api.patch(`/suppliers/purchase-orders/${id}/status`, data),
};

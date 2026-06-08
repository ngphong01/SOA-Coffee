import api from './axios.config';
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getOne: (productId) => api.get(`/inventory/${productId}`),
  getStats: () => api.get('/inventory/stats'),
  getLowStockAlerts: () => api.get('/inventory/alerts'),
  getTransactions: (params) => api.get('/inventory/transactions', { params }),
  importStock: (data) => api.post('/inventory/import', data),
  exportStock: (data) => api.post('/inventory/export', data),
  adjustStock: (data) => api.patch('/inventory/adjust', data),
};

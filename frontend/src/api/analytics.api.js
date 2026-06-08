import api from './axios.config';

export const analyticsAPI = {
  getDashboardSummary: () => api.get('/analytics/dashboard'),
  getRevenue: (params) => api.get('/analytics/revenue', { params }),
  getTopProducts: (params) => api.get('/analytics/top-products', { params }),
};

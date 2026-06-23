import api from './axios.config';

export const analyticsAPI = {
  getDashboardSummary: () => api.get('/analytics/dashboard'),
  getRevenue: (params) => api.get('/analytics/revenue', { params }),
  getTopProducts: (params) => api.get('/analytics/top-products', { params }),
  getPaymentStats: () => api.get('/payments/stats'),
  getCustomerStats: () => api.get('/users/customers/stats'),
  getEmployeeStats: () => api.get('/employees/stats'),
  getAuthStats: () => api.get('/auth/stats'),
  getCategories: () => api.get('/categories'),
};

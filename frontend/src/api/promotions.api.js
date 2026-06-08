import api from './axios.config';
export const promotionsAPI = {
  getAll: (params) => api.get('/promotions', { params }),
  getOne: (id) => api.get(`/promotions/${id}`),
  create: (data) => api.post('/promotions', data),
  update: (id, data) => api.put(`/promotions/${id}`, data),
  getCoupons: (params) => api.get('/promotions/coupons', { params }),
  validateCoupon: (data) => api.post('/promotions/coupons/validate', data),
  generateCoupons: (data) => api.post('/promotions/coupons/generate', data),
};

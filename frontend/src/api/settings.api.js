import api from './axios.config';

export const settingsAPI = {
  getGeneral: () => api.get('/settings/general'),
  updateGeneral: (data) => api.put('/settings/general', data),
  getRoles: () => api.get('/settings/roles'),
  updateRoles: (data) => api.put('/settings/roles', data),
  getUsers: () => api.get('/settings/users'),
  updateUser: (id, data) => api.put(`/settings/users/${id}`, data),
  updateProfile: (data) => api.put('/settings/profile', data),
  uploadAvatar: (base64Image) => api.post('/upload/avatar', { image: base64Image }),
};

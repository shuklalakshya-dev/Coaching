import api from './api';

export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  toggleStatus: (id) => api.put(`/students/${id}/toggle-status`),
  getDashboardStats: () => api.get('/students/dashboard-stats'),
};

export const attendanceService = {
  mark: (data) => api.post('/attendance', data),
  getByStudent: (studentId, params) => api.get(`/attendance/${studentId}`, { params }),
  getByDate: (date) => api.get(`/attendance/date/${date}`),
  update: (id, data) => api.put(`/attendance/${id}`, data),
};

export const marksService = {
  add: (data) => api.post('/marks', data),
  getAll: (params) => api.get('/marks', { params }),
  getByStudent: (studentId, params) => api.get(`/marks/${studentId}`, { params }),
  update: (id, data) => api.put(`/marks/${id}`, data),
  delete: (id) => api.delete(`/marks/${id}`),
};

export const reportService = {
  getAll: (params) => api.get('/report', { params }),
  getByStudent: (studentId, params) => api.get(`/report/${studentId}`, { params }),
  updateRemarks: (id, remarks) => api.put(`/report/${id}`, { remarks }),
};

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

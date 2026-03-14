import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('professional');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const childrenAPI = {
  list: () => api.get('/children'),
  detail: (childId) => api.get(`/children/${childId}`),
  create: (data) => api.post('/children', data),
  update: (childId, data) => api.put(`/children/${childId}`, data),
};

export const appointmentsAPI = {
  list: (params) => api.get('/appointments', { params }),
  listByChild: (childId, params) => api.get(`/appointments/child/${childId}`, { params }),
  create: (data) => api.post('/appointments', data),
  update: (appointmentId, data) => api.put(`/appointments/${appointmentId}`, data),
  delete: (appointmentId) => api.delete(`/appointments/${appointmentId}`),
};

export const conversationsAPI = {
  list: () => api.get('/conversations'),
  messages: (conversationId) => api.get(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, content) => api.post(`/conversations/${conversationId}/messages`, null, {
    params: { content }
  }),
};

export const professionalConversationsAPI = {
  list: () => api.get('/professional-conversations'),
  messages: (conversationId) => api.get(`/professional-conversations/${conversationId}/messages`),
};

export const documentsAPI = {
  list: (params) => api.get('/documents', { params }),
};

export const invoicesAPI = {
  list: (params) => api.get('/invoices', { params }),
  detail: (invoiceId) => api.get(`/invoices/${invoiceId}`),
  updateStatus: (invoiceId, data) => api.patch(`/invoices/${invoiceId}/status`, null, { params: data }),
  createFromContract: (data) => api.post('/invoices/create-from-contract', data),
};

export const schoolHolidaysAPI = {
  list: (zone, year) => api.get('/school-holidays', { params: { zone, year } }),
};

export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
};

export const contractsAPI = {
  list: (params) => api.get('/contracts', { params }),
  detail: (contractId) => api.get(`/contracts/${contractId}`),
  create: (data) => api.post('/contracts', data),
  update: (contractId, data) => api.put(`/contracts/${contractId}`, data),
};

export const quotesAPI = {
  list: (params) => api.get('/quotes', { params }),
  detail: (quoteId) => api.get(`/quotes/${quoteId}`),
  create: (data) => api.post('/quotes', null, { params: data }),
  update: (quoteId, data) => api.put(`/quotes/${quoteId}`, null, { params: data }),
  updateStatus: (quoteId, status) => api.patch(`/quotes/${quoteId}/status`, null, { params: { status } }),
  convertToContract: (quoteId, data) => api.post(`/quotes/${quoteId}/convert-to-contract`, null, { params: data }),
};

export const profileAPI = {
  update: (data) => api.put('/professionals/me', data),
};

export default api;

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
};

export const appointmentsAPI = {
  list: (params) => api.get('/appointments', { params }),
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
};

export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
};

export default api;

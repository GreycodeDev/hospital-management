import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

export const patientAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  search: (query) => api.get('/patients/search', { params: { query } }),
  register: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  getStats: () => api.get('/patients/stats'),
};

export const bedAPI = {
  getAll: (params) => api.get('/beds', { params }),
  getAvailable: (params) => api.get('/beds/available', { params }),
  getById: (id) => api.get(`/beds/${id}`),
  create: (data) => api.post('/beds', data),
  update: (id, data) => api.put(`/beds/${id}`, data),
  getStats: () => api.get('/beds/stats'),
  getWards: () => api.get('/beds/wards'),
};

export const admissionAPI = {
  getAll: (params) => api.get('/admissions', { params }),
  getCurrent: (params) => api.get('/admissions/current', { params }),
  getById: (id) => api.get(`/admissions/${id}`),
  admitPatient: (data) => api.post('/admissions', data),
  dischargePatient: (id, data) => api.put(`/admissions/${id}/discharge`, data),
  getStats: () => api.get('/admissions/stats'),
};

export const billingAPI = {
  getPatientBillings: (patientId, params) => api.get(`/billing/patient/${patientId}`, { params }),
  addService: (data) => api.post('/billing/service', data),
  addBedCharges: (data) => api.post('/billing/bed-charges', data),
  generateFinalBill: (data) => api.post('/billing/generate-bill', data),
  markAsPaid: (id) => api.put(`/billing/${id}/mark-paid`),
  processPayment: (billId, data) => api.put(`/billing/bill/${billId}/pay`, data),
  getStats: () => api.get('/billing/stats'),
};

export const serviceAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  getByType: (type) => api.get(`/services/type/${type}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  getStats: () => api.get('/services/stats'),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};

export default api;
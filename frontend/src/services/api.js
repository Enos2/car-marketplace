// =============================================================
// FILE: frontend/src/services/api.js
// =============================================================
// Purpose:
//   Single axios instance for all backend calls. Handles baseURL,
//   credentials (cookies), and normalized errors. Every API call
//   goes through this — components never call fetch/axios directly.
// =============================================================

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    return Promise.reject({
      status: status || 0,
      message:
        data?.error || error.message || 'Something went wrong. Please try again.',
      details: data?.details || null,
    });
  }
);

export default api;

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data),
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const vehicleApi = {
  list: (params = {}) => api.get('/vehicles', { params }).then((r) => r.data),
  get: (id) => api.get(`/vehicles/${id}`).then((r) => r.data),
  create: (payload) => api.post('/vehicles', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/vehicles/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/vehicles/${id}`).then((r) => r.data),
  submit: (id) => api.post(`/vehicles/${id}/submit`).then((r) => r.data),
  toggleFavorite: (id) =>
    api.post(`/vehicles/${id}/favorite`).then((r) => r.data),
  createInquiry: (vehicleId, payload) =>
    api.post(`/vehicles/${vehicleId}/inquiries`, payload).then((r) => r.data),
};

export const exchangeApi = {
  rate: () => api.get('/exchange/rate').then((r) => r.data),
};

// =============================================================
// END OF FILE: frontend/src/services/api.js
// =============================================================
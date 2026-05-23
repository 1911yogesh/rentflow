import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach token from localStorage on each request (persistent login)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Global error interceptor — auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (d) => api.post('/auth/register', d),
  // OTP functionality temporarily disabled for future release
  verifyOTP:      (d) => api.post('/auth/verify-otp', d),
  resendOTP:      (d) => api.post('/auth/resend-otp', d),
  login:          (d) => api.post('/auth/login', d),
  getMe:          ()  => api.get('/auth/me'),
  changePassword: (d) => api.put('/auth/password', d),
  forgotPassword: (d) => api.post('/auth/forgot-password', d),
  resetPassword:  (token, d) => api.post(`/auth/reset-password/${token}`, d),
};

// ── Areas ─────────────────────────────────────────────────────────────────────
export const areasAPI = {
  getAll:  ()       => api.get('/areas'),
  create:  (d)      => api.post('/areas', d),
  update:  (id, d)  => api.put(`/areas/${id}`, d),
  delete:  (id)     => api.delete(`/areas/${id}`),
  remove:  (id)     => api.delete(`/areas/${id}`),
};

// ── Houses ────────────────────────────────────────────────────────────────────
export const housesAPI = {
  getAll:  (p)      => api.get('/houses', { params: typeof p === 'string' ? { area: p } : p }),
  getOne:  (id)     => api.get(`/houses/${id}`),
  create:  (d)      => api.post('/houses', d),
  update:  (id, d)  => api.put(`/houses/${id}`, d),
  delete:  (id)     => api.delete(`/houses/${id}`),
  remove:  (id)     => api.delete(`/houses/${id}`),
  vacate:  (id)     => api.post(`/houses/${id}/vacate`),
  getDue:  (id)     => api.get(`/houses/${id}/due`),
};

// ── Rent Records ──────────────────────────────────────────────────────────────
export const rentRecordsAPI = {
  getAll:        (p)         => api.get('/rent-records', { params: p }),
  getOne:        (id)        => api.get(`/rent-records/${id}`),
  create:        (d)         => api.post('/rent-records', d),
  update:        (id, d)     => api.put(`/rent-records/${id}`, d),
  delete:        (id)        => api.delete(`/rent-records/${id}`),
  remove:        (id)        => api.delete(`/rent-records/${id}`),
  addPayment:    (id, d)     => api.post(`/rent-records/${id}/payments`, d),
  deletePayment: (id, txnId) => api.delete(`/rent-records/${id}/payments/${txnId}`),
  removePayment: (id, txnId) => api.delete(`/rent-records/${id}/payments/${txnId}`),
  getDashboard:  (p)         => api.get('/rent-records/dashboard', { params: p }),
  dashboard:     (p)         => api.get('/rent-records/dashboard', { params: p }),
};

export const paymentsAPI = {
  create: (d) => api.post('/payments', d),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsAPI = {
  get:    ()  => api.get('/settings'),
  update: (d) => api.put('/settings', d),
};

export default api;

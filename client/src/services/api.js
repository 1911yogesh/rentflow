import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rf_token');
      localStorage.removeItem('rf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/password', data),
};

// ── Areas ──────────────────────────────────────────────────────────────────────
export const areasAPI = {
  getAll:  ()         => api.get('/areas'),
  create:  (data)     => api.post('/areas', data),
  update:  (id, data) => api.put(`/areas/${id}`, data),
  remove:  (id)       => api.delete(`/areas/${id}`),
};

// ── Houses ─────────────────────────────────────────────────────────────────────
export const housesAPI = {
  getAll:  (areaId)   => api.get('/houses', { params: { area: areaId } }),
  getOne:  (id)       => api.get(`/houses/${id}`),
  create:  (data)     => api.post('/houses', data),
  update:  (id, data) => api.put(`/houses/${id}`, data),
  remove:  (id)       => api.delete(`/houses/${id}`),
  vacate:  (id)       => api.post(`/houses/${id}/vacate`),
};

// ── Payments ───────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  dashboard: ()         => api.get('/payments/dashboard'),
  getAll:    (params)   => api.get('/payments', { params }),
  getOne:    (id)       => api.get(`/payments/${id}`),
  create:    (data)     => api.post('/payments', data),
  remove:    (id)       => api.delete(`/payments/${id}`),
};

export default api;

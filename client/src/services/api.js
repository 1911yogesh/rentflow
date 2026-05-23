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

// ── Rent Records (new primary API) ─────────────────────────────────────────────
export const rentRecordsAPI = {
  dashboard:    ()             => api.get('/rent-records/dashboard'),
  getAll:       (params)       => api.get('/rent-records', { params }),
  getOne:       (id)           => api.get(`/rent-records/${id}`),
  create:       (data)         => api.post('/rent-records', data),
  update:       (id, data)     => api.put(`/rent-records/${id}`, data),
  remove:       (id)           => api.delete(`/rent-records/${id}`),
  // Payment transactions
  addPayment:   (id, data)     => api.post(`/rent-records/${id}/payments`, data),
  removePayment:(id, txnId)    => api.delete(`/rent-records/${id}/payments/${txnId}`),
};

// ── Settings ───────────────────────────────────────────────────────────────────
export const settingsAPI = {
  get:    ()     => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// ── Legacy payments (kept for backward compat) ─────────────────────────────────
export const paymentsAPI = {
  dashboard: ()         => api.get('/rent-records/dashboard'), // redirect to new
  getAll:    (params)   => api.get('/rent-records', { params }),
  getOne:    (id)       => api.get(`/rent-records/${id}`),
  create:    (data)     => api.post('/payments', data),
  remove:    (id)       => api.delete(`/payments/${id}`),
};

export default api;

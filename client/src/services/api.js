import axios from 'axios';

/**
 * Shared axios client. In development the Vite dev server proxies /api to
 * http://localhost:5000, so no absolute URL is needed here.
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

function errorMessage(error) {
  return (
    error.response?.data?.message || error.message || 'Something went wrong'
  );
}

export const authApi = {
  login: (data) => api.post('/auth/login', data),
};

export const memberApi = {
  list: (params = {}) => api.get('/members', { params }),
  create: (data) => api.post('/members', data),
  getById: (id) => api.get(`/members/${id}`),
};

export const bookApi = {
  list: (params = {}) => api.get('/books', { params }),
  create: (data) => api.post('/books', data),
  getById: (id) => api.get(`/books/${id}`),
};

export const borrowingApi = {
  list: (params = {}) => api.get('/borrowings', { params }),
  issue: (data) => api.post('/borrowings/issue', data),
  returnBook: (id) => api.post(`/borrowings/return/${id}`),
};

export const fineApi = {
  overdue: () => api.get('/fines/overdue'),
  preview: (recordId) => api.get(`/fines/preview/${recordId}`),
};

export const auditApi = {
  list: (params = {}) => api.get('/audits', { params }),
};

export const statsApi = {
  overview: () => api.get('/stats'),
};

export { errorMessage };
export default api;

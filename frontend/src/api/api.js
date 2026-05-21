import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
}

// Articles
export const articlesAPI = {
  getAll: (params) => api.get('/api/articles', { params }),
  getMy: (params) => api.get('/api/articles/my', { params }),
  getPending: (params) => api.get('/api/articles/pending', { params }),
  getById: (id) => api.get(`/api/articles/${id}`),
  create: (data) => api.post('/api/articles', data),
  update: (id, data) => api.put(`/api/articles/${id}`, data),
  delete: (id) => api.delete(`/api/articles/${id}`),
  submit: (id) => api.post(`/api/articles/${id}/submit`),
  approve: (id, data) => api.post(`/api/articles/${id}/approve`, data),
  reject: (id, data) => api.post(`/api/articles/${id}/reject`, data),
  archive: (id) => api.post(`/api/articles/${id}/archive`),
}

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/api/categories'),
  create: (data) => api.post('/api/categories', data),
  update: (id, data) => api.put(`/api/categories/${id}`, data),
  delete: (id) => api.delete(`/api/categories/${id}`),
}

// Tags
export const tagsAPI = {
  getAll: () => api.get('/api/tags'),
  create: (data) => api.post('/api/tags', data),
  delete: (id) => api.delete(`/api/tags/${id}`),
}

// Search
export const searchAPI = {
  search: (params) => api.get('/api/search', { params }),
}

// Comments
export const commentsAPI = {
  getByArticle: (articleId) => api.get(`/api/articles/${articleId}/comments`),
  create: (articleId, data) => api.post(`/api/articles/${articleId}/comments`, data),
  delete: (commentId) => api.delete(`/api/comments/${commentId}`),
}

// Ratings
export const ratingsAPI = {
  rate: (articleId, data) => api.post(`/api/articles/${articleId}/rate`, data),
  getRating: (articleId) => api.get(`/api/articles/${articleId}/rating`),
}

// Bookmarks
export const bookmarksAPI = {
  toggle: (articleId) => api.post(`/api/bookmarks/${articleId}`),
  getAll: () => api.get('/api/bookmarks'),
}

// Attachments
export const attachmentsAPI = {
  upload: (articleId, formData) => api.post(`/api/articles/${articleId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByArticle: (articleId) => api.get(`/api/articles/${articleId}/attachments`),
  delete: (attachmentId) => api.delete(`/api/attachments/${attachmentId}`),
  download: (attachmentId) => api.get(`/api/attachments/${attachmentId}/download`, { responseType: 'blob' }),
}

// Users
export const usersAPI = {
  getAll: (params) => api.get('/api/users', { params }),
  updateRole: (userId, data) => api.put(`/api/users/${userId}/role`, data),
  updateStatus: (userId, data) => api.put(`/api/users/${userId}/status`, data),
}

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getTrends: (period = '30d') => api.get(`/api/analytics/trends?period=${period}`),
  getKeywords: (limit = 20, period = '30d') => api.get(`/api/analytics/keywords?limit=${limit}&period=${period}`),
  getAuthors: () => api.get('/api/analytics/authors'),
  exportReport: (type, format = 'csv') => api.get(`/api/analytics/export?type=${type}&format=${format}`, { responseType: 'blob' }),
}

// ETL
export const etlAPI = {
  import: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/etl/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
  },
  getJobs: (page = 1, limit = 10) => api.get(`/api/etl/jobs?page=${page}&limit=${limit}`),
  getJob: (id) => api.get(`/api/etl/jobs/${id}`),
  generateSample: () => api.post('/api/etl/generate-sample'),
  downloadSample: (format) => api.get(`/api/etl/sample/download/${format}`, { responseType: 'blob' }),
}

export const downloadBlob = (blobData, filename) => {
  const url = window.URL.createObjectURL(new Blob([blobData]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default api

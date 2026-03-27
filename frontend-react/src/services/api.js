import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const videoAPI = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
  list: () => api.get('/videos/'),
  get: (id) => api.get(`/videos/${id}`),
  delete: (id) => api.delete(`/videos/${id}`),
  getStatus: (id) => api.get(`/videos/${id}/status`),
  summarize: (id) => api.post(`/videos/${id}/summarize`),
  getPlaybackUrl: (id) => {
    const token = localStorage.getItem('token');
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const url = `${base}/videos/${id}/media`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  },
};

export const chatAPI = {
  ask: (videoId, question, sessionId = null) =>
    api.post(`/chat/${videoId}`, { question, session_id: sessionId }),
  getSessions: (videoId) => api.get(`/chat/sessions/${videoId}`),
  getMessages: (sessionId) => api.get(`/chat/session/${sessionId}/messages`),
  deleteSession: (sessionId) => api.delete(`/chat/session/${sessionId}`),
};

export default api;

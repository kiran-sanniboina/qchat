import axios from 'axios';

let rawBase = import.meta.env.VITE_API_URL;
if (!rawBase || rawBase.includes('qchat-backend.onrender.com')) {
  rawBase = 'https://qchat-backend-8tbz.onrender.com/api';
} else if (rawBase.includes('localhost') && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  rawBase = 'https://qchat-backend-8tbz.onrender.com/api';
}
if (rawBase && !rawBase.startsWith('http://') && !rawBase.startsWith('https://')) {
  rawBase = `https://${rawBase}`;
}
rawBase = rawBase.replace(/\/+$/, '');
if (!rawBase.endsWith('/api')) {
  rawBase = `${rawBase}/api`;
}
const API_BASE = rawBase;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qchat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept 401s for token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('qchat_token');
        localStorage.removeItem('qchat_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;


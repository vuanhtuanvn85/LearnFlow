import axios from 'axios';

// Dev: relative URL (Vite proxy → localhost:3001)
// Production: VITE_API_URL = https://learnflow-bd4y.onrender.com
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL });

// Tự động gắn JWT token vào mọi request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('lf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function saveToken(token) {
  localStorage.setItem('lf_token', token);
}

export function clearToken() {
  localStorage.removeItem('lf_token');
}

export function getToken() {
  return localStorage.getItem('lf_token');
}

export default api;

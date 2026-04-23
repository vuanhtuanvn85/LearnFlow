import axios from 'axios';

// Dev: relative URL (Vite proxy → localhost:3001)
// Production: VITE_API_URL = https://learnflow-bd4y.onrender.com
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL, withCredentials: true });

export default api;

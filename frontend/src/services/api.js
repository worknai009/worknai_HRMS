import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

/* ================= REQUEST ================= */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE ================= */
API.interceptors.response.use(
  (res) => res,
  (err) => {
    // Check if error is 401 (Unauthorized)
    if (err.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // ⚠️ FIX: Don't logout if user is trying to login
      if (
        !currentPath.includes('login') && 
        !currentPath.includes('register') &&
        !currentPath.includes('partner-with-us')
      ) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/'; 
      }
    }
    return Promise.reject(err);
  }
);

export default API;

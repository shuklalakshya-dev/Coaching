import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    if (error.response?.status === 401) {
      // Token expired or invalid
      if (error.config.url !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('Session expired. Please log in again.');
      }
    } else if (error.response?.status === 403) {
      toast.error('You are not authorized to perform this action.');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait and try again.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;

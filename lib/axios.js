
// lib/axios.js

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // ✅ sends cookie as fallback
  headers: {
    'Content-Type': 'application/json'
  }
});

// ✅ Attach token to every request automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // CHANGED: also read the token from zustand's saved auth-storage
    const token =
      localStorage.getItem('token') ||
      JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Handle responses + auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // ✅ Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage'); // CHANGED
        // ✅ Redirect to login
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ✅ Auth helpers — use these in your login/logout/register handlers
export const saveAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const isAdmin = () => {
  const user = getStoredUser();
  return user?.role === 'admin';
};

export default api;
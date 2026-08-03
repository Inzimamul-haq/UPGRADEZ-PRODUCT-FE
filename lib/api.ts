import axios from 'axios';
import { refreshAccessToken } from './auth';

const api = axios.create({ 
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + 'csrf-token' + ')=([^;]*)'));
    if (match) {
      config.headers['x-csrf-token'] = decodeURIComponent(match[3]);
    }
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;
    const url = originalRequest.url || "";
    const isAuthEndpoint =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/logout");

    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

    if (
      err.response?.status === 401 && 
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isLoginPage
    ) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();
        return api(originalRequest);
      } catch (refreshErr: any) {
        if (refreshErr.response?.data) {
          refreshErr.response.data.error = "Session expired. Please log in again.";
        } else {
          refreshErr.message = "Session expired. Please log in again.";
        }
        return Promise.reject(refreshErr);
      }
    }
    
    // Inject clean error message into err.message for unhandled cases
    if (err.response?.data?.error) {
      err.message = err.response.data.error;
    } else if (err.response?.data?.message) {
      err.message = err.response.data.message;
    }
    
    return Promise.reject(err);
  }
);

export default api;

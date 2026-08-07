import axios from 'axios';
import { refreshAccessToken } from './auth';

const api = axios.create({ 
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  withCredentials: true,
});

if (typeof window !== 'undefined') {
  const slug = window.location.hostname.split('.')[0];
  api.defaults.headers.common['X-College-Slug'] = slug;
}

api.interceptors.request.use(async (config) => {
  // Option 1: PRODUCTION CUSTOM DOMAIN SETUP (Using First-Party Cookies)
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + 'csrf-token' + ')=([^;]*)'));
    if (match) {
      config.headers['x-csrf-token'] = decodeURIComponent(match[3]);
    }
  }

  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;
    const url = originalRequest.url || "";
    const isAuthEndpoint =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/logout") ||
      // Never silently refresh when checking session status — this is the
      // call that determines IF the user is logged in. Refreshing here causes
      // the redirect-after-logout bug: cleared accessToken → 401 → refresh
      // fires → new accessToken issued → /me succeeds → pushed to dashboard.
      url.includes("/api/auth/me");

    const isPublicRoute = typeof window !== 'undefined' &&
      (window.location.pathname === '/login' ||
       window.location.pathname === '/signup' ||
       window.location.pathname.startsWith('/super-admin-register'));

    if (
      err.response?.status === 401 && 
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isPublicRoute
    ) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshAccessToken();
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr: any) {
        processQueue(refreshErr, null);
        if (refreshErr.response?.data) {
          refreshErr.response.data.error = "Session expired. Please log in again.";
        } else {
          refreshErr.message = "Session expired. Please log in again.";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
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

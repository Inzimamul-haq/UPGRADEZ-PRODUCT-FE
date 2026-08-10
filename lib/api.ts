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
      url.includes("/api/auth/forgot-password") ||
      url.includes("/api/auth/verify-otp") ||
      url.includes("/api/auth/reset-password") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/logout");
      // /api/auth/me intentionally excluded — it must be allowed to trigger
      // a refresh. It's the first call that determines session validity, and
      // if the access token expired the refresh token may still be valid.

    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
      // isPublicRoute gate removed — a public route with a valid refresh token
      // must still silently refresh (e.g. user lands on /login or /signup with
      // an expired access token but a still-valid session cookie).
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
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

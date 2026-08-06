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

let cachedCsrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

api.interceptors.request.use(async (config) => {
  // ==========================================================================
  // Option 2: Fetch CSRF token from API (Required for Vercel/Render cross-origin)
  // ==========================================================================
  if (config.url !== '/api/auth/csrf-token') {
    const method = config.method?.toUpperCase();
    // CSRF is only needed for mutating requests
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      if (!cachedCsrfToken) {
        if (!csrfTokenPromise) {
          csrfTokenPromise = api.get('/api/auth/csrf-token').then(res => {
            cachedCsrfToken = res.data.csrfToken;
            return cachedCsrfToken as string;
          }).catch(err => {
            console.error("Failed to fetch CSRF token", err);
            return '';
          }).finally(() => {
            csrfTokenPromise = null;
          });
        }
        await csrfTokenPromise;
      }
      if (cachedCsrfToken) {
        config.headers['x-csrf-token'] = cachedCsrfToken;
      }
    }
  }

  // ==========================================================================
  // Option 1: PRODUCTION CUSTOM DOMAIN SETUP (When you buy studymate.app)
  // ==========================================================================
  // 1. Delete all the "Option 2" code block above.
  // 2. Uncomment the code block below.
  // 3. In Render, set COOKIE_DOMAIN=.studymate.app
  // ==========================================================================
  /*
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + 'csrf-token' + ')=([^;]*)'));
    if (match) {
      config.headers['x-csrf-token'] = decodeURIComponent(match[3]);
    }
  }
  */

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
      url.includes("/api/auth/logout");

    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

    if (
      err.response?.status === 401 && 
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isLoginPage
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

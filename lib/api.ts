import axios from 'axios';
import { getAccessToken, refreshAccessToken } from './auth';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await refreshAccessToken();
      return api(err.config);
    }
    return Promise.reject(err);
  }
);

export default api;

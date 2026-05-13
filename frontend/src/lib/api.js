/**
 * Client Axios avec interceptors (auto-refresh token)
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Stockage des tokens
export const tokenStorage = {
  get accessToken() {
    return localStorage.getItem('gymflow_access_token');
  },
  set accessToken(v) {
    if (v) localStorage.setItem('gymflow_access_token', v);
    else localStorage.removeItem('gymflow_access_token');
  },
  get refreshToken() {
    return localStorage.getItem('gymflow_refresh_token');
  },
  set refreshToken(v) {
    if (v) localStorage.setItem('gymflow_refresh_token', v);
    else localStorage.removeItem('gymflow_refresh_token');
  },
  clear() {
    localStorage.removeItem('gymflow_access_token');
    localStorage.removeItem('gymflow_refresh_token');
  },
};

// Interceptor request — inject Bearer
api.interceptors.request.use((config) => {
  const token = tokenStorage.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor response — auto-refresh sur 401
let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      tokenStorage.refreshToken &&
      !original.url.includes('/auth/refresh-token') &&
      !original.url.includes('/auth/login')
    ) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios.post(`${API_URL}/auth/refresh-token`, {
            refresh_token: tokenStorage.refreshToken,
          });
        }
        const res = await refreshing;
        refreshing = null;
        tokenStorage.accessToken = res.data.data.accessToken;
        original.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  },
);

// Helpers raccourcis
export const apiGet = (url, config) => api.get(url, config).then((r) => r.data);
export const apiPost = (url, data, config) => api.post(url, data, config).then((r) => r.data);
export const apiPut = (url, data, config) => api.put(url, data, config).then((r) => r.data);
export const apiDelete = (url, config) => api.delete(url, config).then((r) => r.data);

import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
  withCredentials: true, // for refresh token cookie
});

// Request: inject access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: handle 401 → refresh → retry, or redirect to login
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Do not intercept 401s for login or refresh itself
    if (
      !original ||
      original.url?.includes('/auth/login') ||
      original.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch(() => Promise.reject(error));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Use raw axios for the refresh call to avoid recursive interception
        const { data } = await axios.post(
          import.meta.env.VITE_API_BASE_URL + '/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        queue.forEach(({ resolve }) => resolve(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        queue.forEach(({ reject }) => reject());
        queue = [];
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

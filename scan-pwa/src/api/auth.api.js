import { apiClient } from '../lib/api';

/**
 * Auth API functions for scan-pwa.
 * Uses apiClient (no interceptors) — auth endpoints must NOT trigger
 * the 401 → refresh → retry cycle.
 */

export const loginApi = (data) => apiClient.post('/auth/login', data);

export const logoutApi = () => apiClient.post('/auth/logout');

export const refreshApi = () => apiClient.post('/auth/refresh');

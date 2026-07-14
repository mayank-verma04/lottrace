import { apiClient } from '../lib/api';

/**
 * Auth API functions.
 * Uses apiClient (no interceptors) — auth endpoints must NOT trigger
 * the 401 → refresh → retry cycle.
 */

export const loginApi = (data) => apiClient.post('/auth/login', data);

export const registerApi = (data) => apiClient.post('/auth/register', data);

export const verifyEmailApi = (data) => apiClient.post('/auth/verify-email', data);

export const resendVerificationApi = (data) => apiClient.post('/auth/resend-verification', data);

export const forgotPasswordApi = (data) => apiClient.post('/auth/forgot-password', data);

export const resetPasswordApi = (data) => apiClient.post('/auth/reset-password', data);

export const acceptInviteApi = (data) => apiClient.post('/auth/accept-invite', data);

export const refreshApi = () => apiClient.post('/auth/refresh');

export const logoutApi = () => apiClient.post('/auth/logout');

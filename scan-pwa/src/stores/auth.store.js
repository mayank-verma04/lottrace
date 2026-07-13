import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  
  setAuth: (user, accessToken) => set({ user, accessToken, isLoading: false }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, accessToken: null, isLoading: false }),
}));

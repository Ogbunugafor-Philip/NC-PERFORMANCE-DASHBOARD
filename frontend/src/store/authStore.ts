import { create } from 'zustand';
import type { UserProfile } from '../types/auth';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  requiresPasswordChange: boolean;
  setAuth: (token: string, requiresPasswordChange: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  clearAuth: () => void;
  setRequiresPasswordChange: (value: boolean) => void;
}

const tokenKey = 'nc_access_token';
const forceKey = 'nc_requires_password_change';

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(tokenKey),
  user: null,
  requiresPasswordChange: localStorage.getItem(forceKey) === 'true',
  setAuth: (token, requiresPasswordChange) => {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(forceKey, String(requiresPasswordChange));
    set({ token, requiresPasswordChange });
  },
  setUser: (user) => set({ user }),
  clearAuth: () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(forceKey);
    set({ token: null, user: null, requiresPasswordChange: false });
  },
  setRequiresPasswordChange: (value) => {
    localStorage.setItem(forceKey, String(value));
    set({ requiresPasswordChange: value });
  }
}));

export const getStoredToken = () => localStorage.getItem(tokenKey);

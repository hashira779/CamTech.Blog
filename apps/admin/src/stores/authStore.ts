import { create } from 'zustand';
import type { AdminUser } from '../lib/auth';
import {
  getToken,
  getUser,
  setAuth as persistAuth,
  logout as clearAuthStorage,
  isAuthenticated as checkIsAuthenticated,
} from '../lib/auth';

export type { AdminUser };

export interface AuthState {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
  setUser: (user: AdminUser | null) => void;
  syncAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  user: getUser(),
  isAuthenticated: checkIsAuthenticated(),

  login: (token: string, user: AdminUser) => {
    persistAuth(token, user);
    set({
      token,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    clearAuthStorage();
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: AdminUser | null) => {
    if (user) {
      localStorage.setItem('admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('admin_user');
    }
    set({ user });
  },

  syncAuth: () => {
    const token = getToken();
    const user = getUser();
    const isAuthed = checkIsAuthenticated();
    set({
      token,
      user,
      isAuthenticated: isAuthed,
    });
  },
}));

// Listen to auth events dispatched from other components, tabs, or axios interceptors
if (typeof window !== 'undefined') {
  window.addEventListener('auth_state_change', () => {
    useAuthStore.getState().syncAuth();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'admin_token' || event.key === 'admin_user') {
      useAuthStore.getState().syncAuth();
    }
  });
}

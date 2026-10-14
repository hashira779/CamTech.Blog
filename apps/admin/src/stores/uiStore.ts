import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  createdAt: number;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  title?: string;
  duration?: number;
}

export interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Global loading state
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Toast notifications queue
  toasts: ToastItem[];
  addToast: (
    optionsOrMessage: ToastOptions | string,
    type?: ToastType,
    title?: string,
    duration?: number
  ) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const SIDEBAR_STORAGE_KEY = 'admin_sidebar_collapsed';

const getInitialSidebarCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: getInitialSidebarCollapsed(),

  setSidebarCollapsed: (collapsed: boolean) => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // ignore storage errors
    }
    set({ sidebarCollapsed: collapsed });
  },

  toggleSidebar: () => {
    const nextState = !get().sidebarCollapsed;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextState));
    } catch {
      // ignore storage errors
    }
    set({ sidebarCollapsed: nextState });
  },

  isGlobalLoading: false,
  setGlobalLoading: (isGlobalLoading: boolean) => set({ isGlobalLoading }),

  toasts: [],

  addToast: (optionsOrMessage, optType = 'info', optTitle, optDuration = 4500) => {
    let message: string;
    let type: ToastType = optType;
    let title = optTitle;
    let duration = optDuration;

    if (typeof optionsOrMessage === 'object' && optionsOrMessage !== null) {
      message = optionsOrMessage.message;
      type = optionsOrMessage.type || 'info';
      title = optionsOrMessage.title;
      duration = optionsOrMessage.duration ?? 4500;
    } else {
      message = String(optionsOrMessage);
    }

    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = {
      id,
      type,
      title,
      message,
      duration,
      createdAt: Date.now(),
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (duration > 0 && duration !== Infinity) {
      const timer = setTimeout(() => {
        get().removeToast(id);
      }, duration);
      toastTimers.set(id, timer);
    }

    return id;
  },

  removeToast: (id: string) => {
    const timer = toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.delete(id);
    }
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    toastTimers.forEach((timer) => clearTimeout(timer));
    toastTimers.clear();
    set({ toasts: [] });
  },
}));

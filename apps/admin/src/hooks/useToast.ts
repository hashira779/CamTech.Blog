import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';
import type { ToastType, ToastOptions } from '../stores/uiStore';

export type { ToastType, ToastOptions };

export function useToast() {
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);
  const clearToasts = useUIStore((state) => state.clearToasts);
  const toasts = useUIStore((state) => state.toasts);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration?: number) => {
      return addToast(message, type, title, duration);
    },
    [addToast]
  );

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration?: number) => {
      return addToast(message, type, title, duration);
    },
    [addToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) => {
      return addToast(message, 'success', title, duration);
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) => {
      return addToast(message, 'error', title, duration);
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) => {
      return addToast(message, 'warning', title, duration);
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => {
      return addToast(message, 'info', title, duration);
    },
    [addToast]
  );

  return {
    toasts,
    toast,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearToasts,
  };
}

import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { api } from './api';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { getToken } from './auth';

export interface ApiRequestOptions extends AxiosRequestConfig {
  skipToast?: boolean;
}

// Ensure auth token interceptor gets latest token from Zustand store or localStorage
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token || getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to catch API errors and trigger user-friendly toast notifications
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const config = error?.config as ApiRequestOptions | undefined;
    const skipToast = config?.skipToast;
    const status = error.response?.status;

    // Skip showing toast if configured or if 401 (401 is handled by redirection logic)
    if (!skipToast && status !== 401) {
      let message = 'An unexpected error occurred';
      const detail = error.response?.data?.detail;
      const responseMessage = error.response?.data?.message;

      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d: any) => d.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join(', ');
      } else if (detail && typeof detail === 'object') {
        message = detail.message || JSON.stringify(detail);
      } else if (typeof responseMessage === 'string') {
        message = responseMessage;
      } else if (error.message) {
        message = error.message;
      }

      const title = status ? `Error ${status}` : 'Connection Error';
      useUIStore.getState().addToast(message, 'error', title);
    }

    return Promise.reject(error);
  }
);

export const apiClient = {
  instance: api,

  get<T = any>(url: string, config?: ApiRequestOptions): Promise<T> {
    return api.get<T>(url, config).then((res) => res.data);
  },

  post<T = any>(url: string, data?: unknown, config?: ApiRequestOptions): Promise<T> {
    return api.post<T>(url, data, config).then((res) => res.data);
  },

  put<T = any>(url: string, data?: unknown, config?: ApiRequestOptions): Promise<T> {
    return api.put<T>(url, data, config).then((res) => res.data);
  },

  patch<T = any>(url: string, data?: unknown, config?: ApiRequestOptions): Promise<T> {
    return api.patch<T>(url, data, config).then((res) => res.data);
  },

  delete<T = any>(url: string, config?: ApiRequestOptions): Promise<T> {
    return api.delete<T>(url, config).then((res) => res.data);
  },
};

export default apiClient;

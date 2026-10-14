import axios from 'axios';
import { getToken, logout } from './auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true;
        logout();
        // Only redirect if not already on the login page to avoid redirect loops
        if (!window.location.pathname.startsWith('/login')) {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?expired=1&redirect=${encodeURIComponent(currentPath)}`;
        }
        setTimeout(() => {
          isRedirecting = false;
        }, 3000);
      }
    }
    return Promise.reject(error);
  }
);

// Helper for handling API responses cleanly
export interface DashboardStatsResponse {
  metrics: {
    total_articles: number;
    published_articles: number;
    pending_reviews: number;
    total_discoveries: number;
    total_quizzes: number;
    total_tools: number;
    total_sources: number;
    active_sources: number;
    total_pageviews: number;
    total_shares: number;
  };
  top_stories: Array<{
    id: string;
    title: string;
    views: number;
    country: string;
  }>;
  latest_ingestion_logs: Array<{
    source_id: string;
    status: string;
    found: number;
    ingested: number;
    at: string;
  }>;
}

export interface ApiArticle {
  id: string;
  title: string;
  title_km?: string;
  slug: string;
  summary: string;
  status: string;
  country: string;
  category_id?: string;
  author_id?: string;
  views_count: number;
  shares_count: number;
  created_at: string;
  published_at?: string;
  primary_source_url?: string;
  source_attribution_text?: string;
  hero_image_url?: string;
  hero_image_credit?: string;
  hero_image_alt?: string;
}

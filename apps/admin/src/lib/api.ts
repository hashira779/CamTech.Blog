import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
}

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { DashboardStatsResponse, ApiArticle } from '../lib/api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (timeRange?: string) => [...dashboardKeys.all, 'stats', timeRange || 'default'] as const,
  recentArticles: (limit: number) => [...dashboardKeys.all, 'recentArticles', limit] as const,
};

export function useDashboardStats(timeRange?: string) {
  return useQuery<DashboardStatsResponse>({
    queryKey: dashboardKeys.stats(timeRange),
    queryFn: async () => {
      try {
        const stats = await apiClient.get<DashboardStatsResponse>(
          timeRange ? `/admin/dashboard-stats?range=${encodeURIComponent(timeRange)}` : '/admin/dashboard-stats',
          { skipToast: true }
        );
        if (stats?.metrics) {
          return stats;
        }
      } catch (err) {
        console.warn('Dashboard stats endpoint unavailable, computing fallback metrics:', err);
      }

      // Fallback calculation using /articles
      const articlesRes = await apiClient.get<{ items: ApiArticle[]; total: number }>(
        '/articles?limit=8',
        { skipToast: true }
      );
      const items = articlesRes?.items || [];
      const published = items.filter((a) => a.status === 'PUBLISHED').length;
      const pending = items.filter((a) => a.status === 'IN_REVIEW' || a.status === 'DRAFT' || a.status === 'AI_DRAFT').length;
      const totalViews = items.reduce((acc, a) => acc + (a.views_count || 0), 0);
      const totalShares = items.reduce((acc, a) => acc + (a.shares_count || 0), 0);

      return {
        metrics: {
          total_articles: articlesRes.total || items.length,
          published_articles: published,
          pending_reviews: pending,
          total_discoveries: 0,
          total_quizzes: 0,
          total_tools: 0,
          total_sources: 0,
          active_sources: 0,
          total_pageviews: totalViews,
          total_shares: totalShares,
        },
        top_stories: items.slice(0, 5).map((a) => ({
          id: a.id,
          title: a.title,
          views: a.views_count || 0,
          country: a.country || 'KH',
        })),
        latest_ingestion_logs: [],
      };
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useRecentArticles(limit: number = 8) {
  return useQuery<{ items: ApiArticle[]; total: number }>({
    queryKey: dashboardKeys.recentArticles(limit),
    queryFn: async () => {
      return apiClient.get<{ items: ApiArticle[]; total: number }>(`/articles?limit=${limit}`);
    },
    staleTime: 1000 * 60,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { ApiArticle } from '../lib/api';

export interface ArticlesParams {
  limit?: number;
  offset?: number;
  page?: number;
  status?: string;
  country?: string;
  search?: string;
  category_id?: string;
  sort_by?: string;
}

export interface ArticlesResponse {
  items: ApiArticle[];
  total: number;
}

export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (params?: ArticlesParams) => [...articleKeys.lists(), params] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (id: string) => [...articleKeys.details(), id] as const,
};

export function useArticles(params?: ArticlesParams) {
  return useQuery({
    queryKey: articleKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
      if (params?.offset !== undefined) queryParams.set('offset', String(params.offset));
      if (params?.page !== undefined) queryParams.set('page', String(params.page));
      if (params?.status && params.status !== 'All') queryParams.set('status', params.status);
      if (params?.country && params.country !== 'ALL') queryParams.set('country', params.country);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.category_id) queryParams.set('category_id', params.category_id);
      if (params?.sort_by) queryParams.set('sort_by', params.sort_by);

      const qs = queryParams.toString();
      const url = qs ? `/articles?${qs}` : '/articles';
      return apiClient.get<ArticlesResponse>(url);
    },
  });
}

export function useArticle(id: string | undefined | null) {
  return useQuery({
    queryKey: articleKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Article ID is required');
      return apiClient.get<ApiArticle>(`/articles/${id}`);
    },
    enabled: Boolean(id),
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ApiArticle> & Record<string, any>) => {
      return apiClient.post<ApiArticle>('/articles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ApiArticle> & Record<string, any>;
    }) => {
      return apiClient.put<ApiArticle>(`/articles/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<{ deleted: boolean }>(`/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
}

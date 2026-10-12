import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ChurchEvent, ChurchProfile, Commission, Faq, HistoryEntry, Paged } from '@/types';
import { api } from './api';

export const useProfile = () =>
  useQuery({ queryKey: ['public', 'profile'], queryFn: () => api<ChurchProfile>('/api/public/church-profile') });

export const useHistory = () =>
  useQuery({
    queryKey: ['public', 'history'],
    queryFn: () => api<{ intro: string; items: HistoryEntry[] }>('/api/public/church-history'),
  });

export const useCommission = (id: string) =>
  useQuery({
    queryKey: ['public', 'commission', id],
    queryFn: () => api<Commission>(`/api/public/commissions/${encodeURIComponent(id)}`),
  });

export const useEvent = (id: string) =>
  useQuery({
    queryKey: ['public', 'event', id],
    queryFn: () => api<ChurchEvent>(`/api/public/events/${encodeURIComponent(id)}`),
  });

export const useFaqs = () =>
  useQuery({ queryKey: ['public', 'faqs'], queryFn: () => api<{ items: Faq[] }>('/api/public/faqs') });

/** Daftar berhalaman untuk FlatList. `params` ikut menjadi bagian cache key. */
export function usePaged<T>(path: string, params: Record<string, string> = {}, auth = false) {
  const search = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '')).toString();
  const query = useInfiniteQuery({
    queryKey: [auth ? 'admin' : 'public', path, search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api<Paged<T>>(`${path}?${search}${search ? '&' : ''}page=${pageParam}`, { auth }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
  return { ...query, items: query.data?.pages.flatMap((p) => p.items) ?? [] };
}

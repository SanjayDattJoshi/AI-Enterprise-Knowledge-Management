// Client: React Query hooks for search API

import { api } from './client';
import { useMutation } from '@tanstack/react-query';

interface SearchPayload {
  query: string;
  conversationId?: string;
}

interface Source {
  chunkId: string;
  label: string;
  title: string;
  excerpt: string;
}

interface SearchResponse {
  messageId: string;
  conversationId: string;
  answer: string;
  sources: Source[];
  latencyMs: number;
}

export const useSearch = () => {
  return useMutation({
    mutationFn: (payload: SearchPayload) =>
      api.post('/search', payload) as Promise<{ status: string; data: SearchResponse }>,
  });
};

export const useFeedback = () => {
  return useMutation({
    mutationFn: ({ messageId, rating }: { messageId: string; rating: 'HELPFUL' | 'NOT_HELPFUL' }) =>
      api.post(`/feedback/${messageId}`, { rating }),
  });
};

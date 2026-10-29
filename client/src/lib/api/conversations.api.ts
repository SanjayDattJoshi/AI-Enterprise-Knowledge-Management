// Client: React Query hooks for conversations API with optimistic cache updates

import { api } from './client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations') as Promise<any>,
  });
};

export const useConversationDetail = (id: string) => {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.get(`/conversations/${id}`) as Promise<any>,
    enabled: !!id,
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/conversations/${id}`),
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['conversations'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['conversations']);

      // Optimistically remove from query cache immediately
      queryClient.setQueryData(['conversations'], (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.filter((c: any) => c.id !== id),
        };
      });

      return { previous };
    },
    onError: (_err, _id, context: any) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['conversations'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

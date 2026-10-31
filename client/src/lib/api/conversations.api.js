// Client: React Query hooks for conversations API with optimistic cache updates
import { api } from './client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
export const useConversations = () => {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: () => api.get('/conversations'),
    });
};
export const useConversationDetail = (id) => {
    return useQuery({
        queryKey: ['conversation', id],
        queryFn: () => api.get(`/conversations/${id}`),
        enabled: !!id,
    });
};
export const useDeleteConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/conversations/${id}`),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['conversations'] });
            // Snapshot previous value
            const previous = queryClient.getQueryData(['conversations']);
            // Optimistically remove from query cache immediately
            queryClient.setQueryData(['conversations'], (old) => {
                if (!old || !old.data)
                    return old;
                return {
                    ...old,
                    data: old.data.filter((c) => c.id !== id),
                };
            });
            return { previous };
        },
        onError: (_err, _id, context) => {
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

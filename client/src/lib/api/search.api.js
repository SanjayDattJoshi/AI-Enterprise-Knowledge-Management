// Client: React Query hooks for search API
import { api } from './client';
import { useMutation } from '@tanstack/react-query';
export const useSearch = () => {
    return useMutation({
        mutationFn: (payload) => api.post('/search', payload),
    });
};
export const useFeedback = () => {
    return useMutation({
        mutationFn: ({ messageId, rating }) => api.post(`/feedback/${messageId}`, { rating }),
    });
};

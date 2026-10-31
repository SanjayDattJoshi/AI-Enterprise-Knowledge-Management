// Client: React Query hooks for feedback API
import { api } from './client';
import { useQuery } from '@tanstack/react-query';
export const useFeedbackList = () => {
    return useQuery({
        queryKey: ['feedback-list'],
        queryFn: () => api.get('/feedback/admin'),
    });
};

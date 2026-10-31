// Client: React Query hooks for admin API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
export const useAdminDashboard = () => {
    return useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: () => api.get('/admin/dashboard'),
    });
};
export const useAdminDocuments = () => {
    return useQuery({
        queryKey: ['admin-documents'],
        queryFn: () => api.get('/admin/documents'),
    });
};
export const useDeleteDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/documents/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        },
    });
};
export const useUploadDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData) => api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        },
    });
};

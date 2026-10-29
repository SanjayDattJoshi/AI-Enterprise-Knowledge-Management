// Client: React Query hooks for admin API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard') as Promise<any>,
  });
};

export const useAdminDocuments = () => {
  return useQuery({
    queryKey: ['admin-documents'],
    queryFn: () => api.get('/admin/documents') as Promise<any>,
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

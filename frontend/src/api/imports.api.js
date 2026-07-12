import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const IMPORTS_KEYS = {
  all: ['imports'],
  list: (params) => ['imports', 'list', params],
  detail: (id) => ['imports', 'detail', id],
  errors: (id, params) => ['imports', 'errors', id, params],
};

/**
 * List imports with pagination and optional filters.
 */
export const useGetImports = (params = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: IMPORTS_KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get('/imports', { params });
      return data;
    },
    ...queryOptions,
  });
};

/**
 * Get single import by ID.
 */
export const useGetImport = (id) => {
  return useQuery({
    queryKey: IMPORTS_KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/imports/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

/**
 * Get paginated errors for an import.
 */
export const useGetImportErrors = (importId, params = {}) => {
  return useQuery({
    queryKey: IMPORTS_KEYS.errors(importId, params),
    queryFn: async () => {
      const { data } = await api.get(`/imports/${importId}/errors`, { params });
      return data;
    },
    enabled: !!importId,
  });
};

/**
 * Upload CSV file and create import job.
 * Sends multipart/form-data with 'file' and 'cte_type' fields.
 */
export const useUploadImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, cteType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cte_type', cteType);

      const { data } = await api.post('/imports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORTS_KEYS.all });
    },
  });
};

/**
 * Download CSV template for a CTE type.
 * Returns blob URL for download.
 */
export const downloadTemplate = async (cteType) => {
  const response = await api.get(`/imports/template/${cteType}`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cteType}_import_template.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

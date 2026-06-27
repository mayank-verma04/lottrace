import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useGetComplianceGaps = (params) => {
  return useQuery({
    queryKey: ['complianceGaps', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/compliance-gaps', { params });
      return data;
    },
  });
};

export const useRequestExport = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/reports/export', payload);
      return data;
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';

export const LOCATIONS_KEYS = {
  all:    ['locations'],
  lists:  () => ['locations', 'list'],
  list:   (params) => ['locations', 'list', params],
  detail: (id) => ['locations', 'detail', id],
};

export const useGetLocations = (params) => useQuery({
  queryKey: LOCATIONS_KEYS.list(params),
  queryFn: async () => {
    const { data } = await api.get('/locations', { params });
    return data;
  },
});

export const useGetLocation = (locationId) => useQuery({
  queryKey: LOCATIONS_KEYS.detail(locationId),
  queryFn: async () => {
    const { data } = await api.get(`/locations/${locationId}`);
    return data;
  },
  enabled: !!locationId,
});

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/locations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEYS.lists() });
      toast.success('Location created');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to create location');
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, ...payload }) => api.patch(`/locations/${locationId}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEYS.detail(variables.locationId) });
      toast.success('Location updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to update location');
    },
  });
};

export const useDeactivateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locationId) => api.post(`/locations/${locationId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEYS.lists() });
      toast.success('Location deactivated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to deactivate location');
    },
  });
};

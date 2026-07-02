import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const notificationKeys = {
  all: ['notifications'],
  lists: () => [...notificationKeys.all, 'list'],
  list: (filters) => [...notificationKeys.lists(), { filters }],
};

export const useGetNotifications = (params = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params });
      return data;
    },
    keepPreviousData: true,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

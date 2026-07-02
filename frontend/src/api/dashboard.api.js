import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const DASHBOARD_KEYS = {
  all: ['dashboard'],
  stats: () => ['dashboard', 'stats'],
  activity: () => ['dashboard', 'activity'],
};

export const useGetDashboardStats = () => useQuery({
  queryKey: DASHBOARD_KEYS.stats(),
  queryFn: async () => {
    const { data } = await api.get('/dashboard/stats');
    return data.data;
  },
});

export const useGetDashboardActivity = () => useQuery({
  queryKey: DASHBOARD_KEYS.activity(),
  queryFn: async () => {
    const { data } = await api.get('/dashboard/activity');
    return data.data;
  },
});

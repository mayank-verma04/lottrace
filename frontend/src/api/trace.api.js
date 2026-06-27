import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const TRACE_KEYS = {
  all: ['trace'],
  forward: (lotId) => ['trace', 'forward', lotId],
  backward: (lotId) => ['trace', 'backward', lotId],
  full: (lotId) => ['trace', 'full', lotId],
};

export const useForwardTrace = (lotId) => {
  return useQuery({
    queryKey: TRACE_KEYS.forward(lotId),
    queryFn: async () => {
      const { data } = await api.get(`/trace/${lotId}/forward`);
      return data;
    },
    enabled: !!lotId,
  });
};

export const useBackwardTrace = (lotId) => {
  return useQuery({
    queryKey: TRACE_KEYS.backward(lotId),
    queryFn: async () => {
      const { data } = await api.get(`/trace/${lotId}/backward`);
      return data;
    },
    enabled: !!lotId,
  });
};

export const useFullTrace = (lotId) => {
  return useQuery({
    queryKey: TRACE_KEYS.full(lotId),
    queryFn: async () => {
      const { data } = await api.get(`/trace/${lotId}/full`);
      return data;
    },
    enabled: !!lotId,
  });
};

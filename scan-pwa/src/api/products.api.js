import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';

export const PRODUCTS_KEYS = {
  all:    ['products'],
  lists:  () => ['products', 'list'],
  list:   (params) => ['products', 'list', params],
  detail: (id) => ['products', 'detail', id],
};

export const useGetProducts = (params) => useQuery({
  queryKey: PRODUCTS_KEYS.list(params),
  queryFn: async () => {
    const { data } = await api.get('/products', { params });
    return data;
  },
});

export const useGetProduct = (productId) => useQuery({
  queryKey: PRODUCTS_KEYS.detail(productId),
  queryFn: async () => {
    const { data } = await api.get(`/products/${productId}`);
    return data;
  },
  enabled: !!productId,
});

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEYS.lists() });
      toast.success('Product created');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to create product');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ...payload }) => api.patch(`/products/${productId}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEYS.detail(variables.productId) });
      toast.success('Product updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to update product');
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Organization Name is required'),
});

export default function OrganizationPage() {
  const queryClient = useQueryClient();
  
  const { data: orgData, isLoading } = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/organizations/me');
      return data.data;
    }
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    values: { name: orgData?.name || '' }
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.patch('/organizations/me', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'me'] });
      toast.success('Organization updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update organization');
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Organization Settings" 
        subtitle="Manage your organization profile and preferences."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <FormField label="Organization Name" error={errors.name?.message}>
              <Input {...register('name')} />
            </FormField>
            
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

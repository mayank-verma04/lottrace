import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

export default function UsersPage() {
  const [params, setParams] = useState({ page: 1, limit: 10 });
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await api.get('/users', { params });
      return data;
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }) => api.post(`/users/${id}/${active ? 'deactivate' : 'reactivate'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  });

  const columns = [
    { accessorKey: 'firstName', header: 'First Name' },
    { accessorKey: 'lastName', header: 'Last Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role', header: 'Role', cell: ({ row }) => <span className="capitalize">{row.original.role.replace('_', ' ')}</span> },
    { 
      accessorKey: 'isActive', 
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'} className={row.original.isActive ? 'bg-green-100 text-green-800' : ''}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        if (!can('org_admin')) return null;
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => toggleStatusMutation.mutate({ id: row.original.id, active: row.original.isActive })}
            disabled={toggleStatusMutation.isPending}
          >
            {row.original.isActive ? 'Deactivate' : 'Reactivate'}
          </Button>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Users" 
        subtitle="Manage users and roles in your organization."
        action={can('org_admin') && <Button>Invite User</Button>}
      />
      
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPaginationChange={setParams}
      />
    </div>
  );
}

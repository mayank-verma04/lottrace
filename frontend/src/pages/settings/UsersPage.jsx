import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, MoreHorizontal } from 'lucide-react';

import {
  useGetUsers,
  useInviteUser,
  useUpdateUser,
  useDeactivateUser,
  useReactivateUser,
  useResendInvite,
} from '@/api/users.api';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/auth.store';


import { DataTable } from '@/components/common/DataTable';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const VALID_ROLES = ['org_admin', 'compliance_manager', 'operator', 'auditor'];

const ROLE_LABELS = {
  org_admin: 'Org Admin',
  compliance_manager: 'Compliance Manager',
  operator: 'Operator',
  auditor: 'Auditor',
};

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(VALID_ROLES, { errorMap: () => ({ message: 'Role is required' }) }),
});

const editRoleSchema = z.object({
  role: z.enum(VALID_ROLES, { errorMap: () => ({ message: 'Role is required' }) }),
});

/** Status badge: invited=amber, active=green, deactivated=gray */
const StatusBadge = ({ status }) => {
  if (status === 'active') {
    return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
  }
  if (status === 'invited') {
    return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Invited</Badge>;
  }
  return <Badge variant="secondary">Deactivated</Badge>;
};

/** Row actions dropdown, gated on status and current user */
const UserActions = ({ user, currentUserId, deactivate, reactivate, resendInvite, openEditRole }) => {
  const isSelf = user.id === currentUserId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">

        {/* --- Invited --- */}
        {user.status === 'invited' && (
          <>
            <DropdownMenuItem onClick={() => resendInvite.mutate(user.id)}>
              Resend Invite
            </DropdownMenuItem>
            {!isSelf && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    Cancel Invite
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel invite?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {user.email} will no longer be able to accept this invitation.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deactivate.mutate(user.id)}>
                      Cancel Invite
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}

        {/* --- Active --- */}
        {user.status === 'active' && (
          <>
            {!isSelf && (
              <DropdownMenuItem onClick={() => openEditRole(user)}>
                Edit Role
              </DropdownMenuItem>
            )}
            {!isSelf && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    Deactivate
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {user.email} will lose access immediately. You can reactivate them later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deactivate.mutate(user.id)}>
                      Deactivate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {isSelf && (
              <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                Cannot modify your own account
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* --- Deactivated --- */}
        {user.status === 'deactivated' && (
          <DropdownMenuItem onClick={() => reactivate.mutate(user.id)}>
            Reactivate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function UsersPage() {
  const [params, setParams] = useState({ page: 1, limit: 10 });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState(null);
  const { can } = usePermissions();
  const { user: currentUser } = useAuthStore();

  const { data, isLoading } = useGetUsers(params);
  const inviteMutation = useInviteUser();
  const updateMutation = useUpdateUser();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  const resendInviteMutation = useResendInvite();

  // Invite form
  const inviteForm = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', firstName: '', lastName: '', role: 'operator' },
  });

  const onInviteSubmit = (formData) => {
    inviteMutation.mutate(formData, {
      onSuccess: () => {
        setInviteOpen(false);
        inviteForm.reset();
      },
    });
  };

  // Edit Role form
  const editRoleForm = useForm({
    resolver: zodResolver(editRoleSchema),
  });

  const openEditRole = (user) => {
    setEditRoleUser(user);
    editRoleForm.setValue('role', user.role);
  };

  const onEditRoleSubmit = (formData) => {
    updateMutation.mutate(
      { userId: editRoleUser.id, role: formData.role },
      { onSuccess: () => setEditRoleUser(null) }
    );
  };

  const columns = [
    { accessorKey: 'firstName', header: 'First Name' },
    { accessorKey: 'lastName', header: 'Last Name' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className="capitalize">{ROLE_LABELS[row.original.role] || row.original.role}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (!can('users.manage')) return null;
        return (
          <UserActions
            user={row.original}
            currentUserId={currentUser?.id}
            deactivate={deactivateMutation}
            reactivate={reactivateMutation}
            resendInvite={resendInviteMutation}
            openEditRole={openEditRole}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Users & Roles</h3>
          <p className="text-sm text-muted-foreground">Manage users and roles in your organization.</p>
        </div>
        {can('users.manage') && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite User</DialogTitle>
              </DialogHeader>
              <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inv-email">Email *</Label>
                  <Input id="inv-email" {...inviteForm.register('email')} placeholder="user@example.com" type="email" />
                  {inviteForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{inviteForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="inv-first">First Name *</Label>
                    <Input id="inv-first" {...inviteForm.register('firstName')} />
                    {inviteForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive">{inviteForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="inv-last">Last Name *</Label>
                    <Input id="inv-last" {...inviteForm.register('lastName')} />
                    {inviteForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive">{inviteForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inv-role">Role *</Label>
                  <Select
                    defaultValue="operator"
                    onValueChange={(v) => inviteForm.setValue('role', v)}
                  >
                    <SelectTrigger id="inv-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {inviteForm.formState.errors.role && (
                    <p className="text-sm text-destructive">{inviteForm.formState.errors.role.message}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setInviteOpen(false); inviteForm.reset(); }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleUser} onOpenChange={(open) => { if (!open) setEditRoleUser(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={editRoleForm.handleSubmit(onEditRoleSubmit)} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Changing role for <strong>{editRoleUser?.email}</strong>
            </p>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select
                value={editRoleForm.watch('role')}
                onValueChange={(v) => editRoleForm.setValue('role', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALID_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditRoleUser(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptInviteApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await acceptInviteApi({
        token,
        email,
        password: data.password,
      });
      const { user, accessToken } = response.data.data;
      useAuthStore.getState().setAuth(user, accessToken);
      toast.success('Account activated! Welcome to LotTrace.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to accept invitation'
      );
    }
  };

  if (!token || !email) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium mb-2">Invalid invitation link</p>
          <p className="text-muted-foreground text-sm">
            This link is missing required parameters. Please contact your organization admin for a new invite.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
        <CardDescription>
          Set a password to activate your account for <strong>{email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="New Password" error={errors.password?.message}>
            <Input
              {...register('password')}
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </FormField>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activate Account
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Expired link? Contact your organization admin for a new invite.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

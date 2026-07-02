import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [isResending, setIsResending] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setUnverifiedEmail(null);
    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (error) {
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.email);
      } else {
        toast.error(error.response?.data?.message || 'Failed to login');
      }
    }
  };

  const handleResendVerification = async () => {
    if (isResending || !unverifiedEmail) return;
    setIsResending(true);

    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success('Verification code sent! Redirecting...');
      setTimeout(() => {
        navigate('/verify-email', { state: { email: unverifiedEmail } });
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Login to your LotTrace account</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Unverified email warning */}
        {unverifiedEmail && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-amber-800">Email not verified</p>
                <p className="text-sm text-amber-700">
                  Please verify your email address before logging in. Check your inbox for the verification code.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  {isResending ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  )}
                  Resend Verification Email
                </Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Email" error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="name@company.com" />
          </FormField>
          
          <FormField label="Password" error={errors.password?.message}>
            <Input {...register('password')} type="password" />
          </FormField>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <div className="text-center text-sm">
            <Link to="/forgot-password" className="text-brand-600 hover:underline">
              Forgot your password?
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

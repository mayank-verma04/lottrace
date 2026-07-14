import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { loginApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { TriangleAlert, RotateCcw } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, accessToken, isLoading } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // Redirect authenticated users away from login
  if (!isLoading && user && accessToken) {
    return <Navigate to="/scan" replace />;
  }

  const onSubmit = async (data) => {
    setUnverifiedEmail(null);
    try {
      const response = await loginApi(data);
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      navigate('/scan');
    } catch (error) {
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.email);
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Check your credentials and try again.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (isResending || !unverifiedEmail) return;
    setIsResending(true);
    try {
      // Use apiClient directly since we don't have resend in scan-pwa auth.api
      const { apiClient } = await import('@/lib/api');
      await apiClient.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo / Wordmark */}
      <div className="mb-8 text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4 shadow-md">
          LT
        </div>
        <h1 className="text-2xl font-bold tracking-tight">LotTrace Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">Mobile scanning for FSMA 204</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your LotTrace account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Unverified email warning */}
          {unverifiedEmail && (
            <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
              <TriangleAlert className="size-4 text-amber-600" />
              <AlertTitle>Email not verified</AlertTitle>
              <AlertDescription className="mt-1 space-y-2 text-amber-700">
                <p>Verify your email before signing in. Check your inbox.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  {isResending ? (
                    <Spinner className="size-3.5" data-icon="inline-start" />
                  ) : (
                    <RotateCcw data-icon="inline-start" />
                  )}
                  Resend Email
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup className="gap-4">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && <FieldError>{errors.password.message}</FieldError>}
              </Field>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting && <Spinner data-icon="inline-start" />}
                Sign In
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Operator access only. Contact your admin for help.
      </p>
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const registerSchema = z.object({
  organizationName: z.string().min(1, 'Organization Name is required'),
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function RegisterPage() {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/register', data);
      toast.success('Registration successful! Please check your email for a verification code.');
      navigate('/verify-email', { state: { email: data.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Organization</CardTitle>
        <CardDescription>Setup your new LotTrace account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Organization Name" error={errors.organizationName?.message}>
            <Input {...register('organizationName')} placeholder="Company LLC" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" error={errors.firstName?.message}>
              <Input {...register('firstName')} placeholder="John" />
            </FormField>
            <FormField label="Last Name" error={errors.lastName?.message}>
              <Input {...register('lastName')} placeholder="Doe" />
            </FormField>
          </div>

          <FormField label="Work Email" error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="name@company.com" />
          </FormField>

          <FormField label="Password" error={errors.password?.message}>
            <Input {...register('password')} type="password" />
          </FormField>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register
          </Button>

          <div className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:underline">
              Log in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

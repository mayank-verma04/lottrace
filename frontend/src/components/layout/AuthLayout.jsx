import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export const AuthLayout = () => {
  const { user, accessToken, isLoading } = useAuthStore();

  // While initial auth check runs, show nothing to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Authenticated users should not see auth pages
  if (user && accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export const ProtectedRoute = ({ children }) => {
  const { user, accessToken, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

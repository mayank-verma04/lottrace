import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export const ProtectedRoute = ({ children }) => {
  const { user, accessToken } = useAuthStore();

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { PageSkeleton } from './Skeleton';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
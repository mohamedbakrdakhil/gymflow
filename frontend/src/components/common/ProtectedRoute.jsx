/**
 * Route protégée — redirige vers /login si pas authentifié
 * et vers / si le rôle ne correspond pas
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultPathForRole(user.role)} replace />;
  }

  return children;
}

export function defaultPathForRole(role) {
  switch (role) {
    case 'super_admin':
      return '/superadmin';
    case 'owner':
      return '/owner';
    case 'coach':
      return '/coach';
    case 'member':
      return '/member';
    default:
      return '/login';
  }
}

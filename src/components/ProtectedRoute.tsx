import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { UserRole, hasAccess, getRoleDefaultRoute } from '@/types/roles';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo,
}) => {
  const { user, profile, loading } = useUser();
  const location = useLocation();

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // No profile loaded
  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  // Check role access
  const userRole = profile.role as UserRole;
  if (!hasAccess(userRole, allowedRoles)) {
    // Show access denied message
    toast.error('Access denied. You do not have permission to view this page.');

    // Redirect based on user role or custom redirect
    const fallbackRedirect = redirectTo || getRoleDefaultRoute(userRole);
    return <Navigate to={fallbackRedirect} replace />;
  }

  // Authorized - render children
  return <>{children}</>;
};

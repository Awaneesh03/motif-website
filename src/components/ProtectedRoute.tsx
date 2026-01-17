import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { UserRole, hasAccess, getRoleDefaultRoute } from '@/types/roles';
import { toast } from 'sonner';

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
  const hasNotifiedRef = useRef(false);

  // Check role access (compute before any returns)
  const userRole = profile?.role as UserRole;
  const isUnauthorized = profile ? !hasAccess(userRole, allowedRoles) : false;

  // useEffect must be called before any conditional returns
  useEffect(() => {
    if (isUnauthorized && !hasNotifiedRef.current) {
      toast.error('Access denied. You do not have permission to view this page.');
      hasNotifiedRef.current = true;
    }
  }, [isUnauthorized]);

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

  if (isUnauthorized) {
    // Redirect based on user role or custom redirect
    const fallbackRedirect = redirectTo || getRoleDefaultRoute(userRole);
    return <Navigate to={fallbackRedirect} replace />;
  }

  // Authorized - render children
  return <>{children}</>;
};

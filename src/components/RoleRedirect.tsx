/**
 * RoleRedirect - Pure Redirect Router
 *
 * This component NEVER renders UI.
 * It ONLY redirects users to their role-specific dashboard.
 *
 * Rules:
 * - admin → /admin/dashboard
 * - vc → /vc/dashboard
 * - founder → /dashboard/home
 */

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getRoleDefaultRoute } from '@/types/roles';

export const RoleRedirect = () => {
  const { profile, loading } = useUser();

  // Show loading spinner while determining role
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Get role-based redirect route
  // If profile is missing or role is invalid, default to founder dashboard
  const userRole = profile?.role || 'founder';
  const redirectTo = getRoleDefaultRoute(userRole);

  // Log redirect for debugging (remove in production)
  useEffect(() => {
    console.log(`[RoleRedirect] User role: ${userRole} → Redirecting to: ${redirectTo}`);
  }, [userRole, redirectTo]);

  // Pure redirect - no UI rendering
  return <Navigate to={redirectTo} replace />;
};

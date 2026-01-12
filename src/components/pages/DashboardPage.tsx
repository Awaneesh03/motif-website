import { motion } from 'motion/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

// Import founder dashboard
import { FounderDashboard } from './founder/FounderDashboard';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

/**
 * DashboardPage - Founder Dashboard Only
 *
 * This component renders the Founder dashboard at /dashboard/home
 * Other roles are redirected by RoleRedirect at /dashboard
 */
export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, profile, loadingUser, isFounder } = useUser();
  const navigate = useNavigate();

  const isLoading = loadingUser || (!!user && !profile);

  // ============================================================================
  // LOADING STATE - While fetching user role
  // ============================================================================
  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
          <h2 className="text-xl font-semibold mb-2">Loading Dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your information</p>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // NO PROFILE / UNAUTHENTICATED - Should not happen with protected routes
  // ============================================================================
  if (!profile) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="glass-surface border-border/50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-orange-600" />
              <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't load your profile. Please try logging in again.
              </p>
              <Button
                className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
                onClick={() => onNavigate?.('Auth')}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // HARD ROLE GUARD - Founder only
  // ============================================================================
  // /dashboard/home is ONLY for founders
  // Admins use /admin/dashboard, VCs use /vc/dashboard
  // However, if user has no role or invalid role, default to showing FounderDashboard
  useEffect(() => {
    if (profile && profile.role && !isFounder) {
      // Only redirect if user has a valid non-founder role
      if (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'vc') {
        console.warn('[DashboardPage] Unauthorized access attempt - redirecting');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [profile, isFounder, navigate]);

  // ============================================================================
  // RENDER FOUNDER DASHBOARD
  // ============================================================================
  // Always render FounderDashboard for authenticated users
  // This ensures the dashboard never shows blank content
  return <FounderDashboard />;
}

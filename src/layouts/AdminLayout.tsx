import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/components/NotificationBell';
import { AdminToolsDropdown } from '@/components/AdminToolsDropdown';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, LogOut, Shield, BookOpen, BarChart3 } from 'lucide-react';

export const AdminLayout = () => {
  const { profile } = useUser();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Admin Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Left Section - Logo & Admin Badge */}
            <div className="flex items-center gap-6">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                <Shield className="h-5 w-5 text-blue-600" />
                Motif
              </Link>
              <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-700">
                Admin
              </Badge>
            </div>

            {/* Center Section - Primary Admin Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === '/admin/dashboard'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/admin/startups"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === '/admin/startups'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Startups
              </Link>
              <Link
                to="/admin/intro-requests"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === '/admin/intro-requests'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Intro Requests
              </Link>
              <Link
                to="/admin/case-studies"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname.startsWith('/admin/case-studies')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Case Studies
              </Link>
              <Link
                to="/idea-analyser"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === '/idea-analyser'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Idea Analyser
              </Link>
              <Link
                to="/pitch-creator"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === '/pitch-creator'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Pitch Creator
              </Link>
            </div>

            {/* Right Section - Tools, Notifications, Profile, Logout */}
            <div className="flex items-center gap-3">
              <AdminToolsDropdown />
              <NotificationBell variant="default" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {profile?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-medium text-gray-900">{profile?.name || 'Admin'}</span>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/admin/startups"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Startups
            </Link>
            <Link
              to="/admin/intro-requests"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              Intro Requests
            </Link>
            <Link
              to="/admin/case-studies"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Case Studies
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary
          fallback={
            <div className="flex min-h-[600px] flex-col items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <svg
                    className="h-8 w-8 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>

                <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>

                <p className="text-muted-foreground mb-6">
                  An error occurred in the admin panel. Please try again or return to the dashboard.
                </p>

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => window.location.reload()}
                    className="rounded-xl"
                  >
                    Try Again
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => window.location.href = '/admin/dashboard'}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          }
        >
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};

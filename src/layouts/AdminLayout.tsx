import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/components/NotificationBell';
import { AdminToolsDropdown } from '@/components/AdminToolsDropdown';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Building2, TrendingUp, LogOut, Shield, BookOpen, BarChart3, Menu } from 'lucide-react';

export const AdminLayout = () => {
  const { profile } = useUser();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const navLinks = [
    { to: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
    { to: '/admin/startups', icon: Building2, label: 'Startups' },
    { to: '/admin/intro-requests', icon: TrendingUp, label: 'Intro Requests' },
    { to: '/admin/case-studies', icon: BookOpen, label: 'Case Studies' },
    { to: '/idea-analyser', icon: TrendingUp, label: 'Idea Analyser' },
    { to: '/pitch-creator', icon: BookOpen, label: 'Pitch Creator' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Admin Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Left Section - Logo & Admin Badge */}
            <div className="flex items-center gap-3 sm:gap-6">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Motif</span>
              </Link>
              <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-700 hidden sm:inline-flex">
                Admin
              </Badge>
            </div>

            {/* Center Section - Primary Admin Navigation (Desktop/Tablet) */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === link.to || (link.to !== '/admin/dashboard' && location.pathname.startsWith(link.to))
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Section - Tools, Notifications, Profile, Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block">
                <AdminToolsDropdown />
              </div>
              <NotificationBell variant="default" />
              
              {/* Profile - Hidden on small screens */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 cursor-default">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {profile?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <span className="text-sm font-medium text-gray-900">{profile?.name || 'Admin'}</span>
                </div>
              </div>

              {/* Logout Button - Hidden on mobile */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="hidden sm:flex text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors items-center gap-2"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Sign out</span>
              </Button>

              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                  <div className="mt-6 flex flex-col gap-2">
                    {/* Profile in mobile menu */}
                    <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-gray-50 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {profile?.name?.charAt(0).toUpperCase() || 'A'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{profile?.name || 'Admin'}</p>
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          location.pathname === link.to || (link.to !== '/admin/dashboard' && location.pathname.startsWith(link.to))
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    ))}

                    {/* Divider */}
                    <div className="h-px bg-gray-200 my-4" />

                    {/* Admin Tools in mobile */}
                    <div className="px-4 sm:hidden">
                      <AdminToolsDropdown />
                    </div>

                    {/* Logout Button */}
                    <Button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="mx-4 mt-4 text-red-600 hover:bg-red-50 hover:border-red-200"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
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

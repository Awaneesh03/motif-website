import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';

import { Toaster } from './components/ui/sonner';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Chatbot } from './components/Chatbot';
import { HomePage } from './components/pages/HomePage';
import { AboutPage } from './components/pages/AboutPage';
import { FeaturesPage } from './components/pages/FeaturesPage';
import { CommunityPage } from './components/pages/CommunityPage';
import { ResourcesPage } from './components/pages/ResourcesPage';
import { ContactPage } from './components/pages/ContactPage';
import { AuthPage } from './components/pages/AuthPage';
import { CaseStudiesPage } from './components/pages/CaseStudiesPage';
import { CaseDetailPage } from './components/pages/CaseDetailPage';
import { IdeaAnalyserPage } from './components/pages/IdeaAnalyserPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { PricingPage } from './components/pages/PricingPage';
import { PitchCreatorPage } from './components/pages/PitchCreatorPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { VCConnectionPage } from './components/pages/VCConnectionPage';
import { SavedIdeasPage } from './components/pages/SavedIdeasPage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { NotificationsPage } from './components/pages/NotificationsPage';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';

// Role-based routing
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRedirect } from './components/RoleRedirect';
import { UserRole } from './types/roles';
import { VCLayout } from './layouts/VCLayout';
import { AdminLayout } from './layouts/AdminLayout';

// VC Pages
import VCDashboard from './components/pages/vc/VCDashboard';
import VCStartups from './components/pages/vc/VCStartups';
import VCStartupDetail from './components/pages/vc/VCStartupDetail';
import VCPendingPage from './components/pages/vc/VCPendingPage';
import VCOnboarding from './components/pages/vc/VCOnboarding';

// Admin Pages
import AdminDashboard from './components/pages/admin/AdminDashboard';
import AdminStartups from './components/pages/admin/AdminStartups';
import AdminIntroRequests from './components/pages/admin/AdminIntroRequests';
import AdminCaseStudies from './components/pages/admin/AdminCaseStudies';
import AdminCaseStudyForm from './components/pages/admin/AdminCaseStudyForm';

// Founder Pages
import SubmitStartupPage from './components/pages/SubmitStartupPage';
import { StartupDetailPage } from './components/pages/StartupDetailPage';

function AppContent() {
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  // isLoggedIn is now derived from UserContext's user state
  const isLoggedIn = !!user;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleNavigate = (page: string, caseId?: string) => {
    const routeMap: Record<string, string> = {
      'Home': '/',
      'About': '/about',
      'Features': '/features',
      'Community': '/community',
      'Resources': '/resources',
      'Contact': '/contact',
      'Auth': '/auth',
      'Case Studies': '/case-studies',
      'Idea Analyser': '/idea-analyser',
      'Profile': '/profile',
      'Settings': '/profile',
      'Pricing': '/pricing',
      'Pitch Creator': '/pitch-creator',
      'Dashboard': '/dashboard',
      'Get Funded': '/get-funded',
      'saved-ideas': '/saved-ideas',
      'Notifications': '/notifications'
    };

    if (caseId) {
      navigate(`/case-studies/${caseId}`);
    } else {
      navigate(routeMap[page] || '/');
    }
  };

  const handleLogin = async () => {
    try {
      // Wait for session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session fetch timed out')), 5000)
      );

      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

      if (!session?.user) {
        console.warn('[handleLogin] No session found, redirecting to home');
        navigate('/');
        return;
      }

      // Redirect immediately; RoleRedirect handles role-based routing
      navigate('/dashboard');
    } catch (error) {
      console.error('[handleLogin] Error during login redirect:', error);
      // Fallback: navigate to dashboard anyway to prevent hanging
      navigate('/dashboard/home');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Get current page name from pathname for navbar highlighting
  const getCurrentPage = () => {
    const pathMap: Record<string, string> = {
      '/': 'Home',
      '/about': 'About',
      '/features': 'Features',
      '/community': 'Community',
      '/resources': 'Resources',
      '/contact': 'Contact',
      '/auth': 'Auth',
      '/case-studies': 'Case Studies',
      '/idea-analyser': 'Idea Analyser',
      '/profile': 'Profile',
      '/pricing': 'Pricing',
      '/pitch-creator': 'Pitch Creator',
      '/dashboard': 'Dashboard',
      '/get-funded': 'Get Funded',
      '/saved-ideas': 'Saved Ideas',
      '/notifications': 'Notifications'
    };

    // Handle case detail pages
    if (location.pathname.startsWith('/case-studies/')) {
      return 'Case Studies';
    }

    return pathMap[location.pathname] || 'Home';
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Toaster position="top-right" />

      <Routes>
        {/* ADMIN ROUTES (Separate Layout) */}
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/startups"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminStartups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/intro-requests"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminIntroRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/case-studies"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminCaseStudies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/case-studies/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminCaseStudyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/case-studies/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminCaseStudyForm />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* VC PORTAL ROUTES (Separate Layout) */}
        <Route element={<VCLayout />}>
          <Route
            path="/vc/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC]}>
                <VCDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/pending"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC_PENDING]}>
                <VCPendingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/startups"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC]}>
                <VCStartups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/startups/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC]}>
                <VCStartupDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/onboarding"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.VC_PENDING, UserRole.FOUNDER]}>
                <VCOnboarding />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* MAIN APP ROUTES (Founder + Public) */}
        <Route
          path="/*"
          element={
            <>
              <Navbar
                isDark={isDark}
                toggleTheme={toggleTheme}
                currentPage={getCurrentPage()}
                onNavigate={handleNavigate}
                isLoggedIn={isLoggedIn}
                onLogout={handleLogout}
              />
              <main>
                <ErrorBoundary>
                  <Routes>
                    {/* Public Routes - Only Home and Auth */}
                    <Route path="/" element={<HomePage onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />} />
                    <Route path="/auth" element={<AuthPage onNavigate={handleNavigate} onLogin={handleLogin} />} />

                    {/* Protected Routes - Require login */}
                    <Route
                      path="/about"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.VC, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                          <AboutPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/features"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.VC, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                          <FeaturesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/contact"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.VC, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                          <ContactPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/case-studies"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.VC, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                          <CaseStudiesPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/case-studies/:caseId"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.VC, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                          <CaseDetailPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pricing"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.VC, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                          <PricingPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />

                    {/* Founder Protected Routes (Admin can access all) */}
                    <Route
                      path="/community"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER]}>
                          <CommunityPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/resources"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER]}>
                          <ResourcesPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/idea-analyser"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                          <IdeaAnalyserPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER]}>
                          <ProfilePage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pitch-creator"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                          <PitchCreatorPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    {/* PURE REDIRECT ROUTER - No UI rendering */}
                    <Route
                      path="/dashboard"
                      element={<RoleRedirect />}
                    />
                    {/* Founder Dashboard (actual UI) */}
                    <Route
                      path="/dashboard/home"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER]}>
                          <DashboardPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/submit-startup"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER]}>
                          <SubmitStartupPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/startups/:id"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER]}>
                          <StartupDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/get-funded"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER]}>
                          <VCConnectionPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/saved-ideas"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER]}>
                          <SavedIdeasPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.VC, UserRole.ADMIN]}>
                          <NotificationsPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Catch-all Route */}
                    <Route path="*" element={<NotFoundPage onNavigate={handleNavigate} />} />
                  </Routes>
                </ErrorBoundary>
              </main>
              <Footer onNavigate={handleNavigate} />

              {/* Chatbot - Available on all pages except Auth and VC Portal */}
              {location.pathname !== '/auth' && <Chatbot isDark={isDark} />}
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

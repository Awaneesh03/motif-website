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
import { MembershipPage } from './components/pages/MembershipPage';
import { PricingPage } from './components/pages/PricingPage';
import { PitchCreatorPage } from './components/pages/PitchCreatorPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { VCConnectionPage } from './components/pages/VCConnectionPage';
import { SavedIdeasPage } from './components/pages/SavedIdeasPage';
import { supabase } from './lib/supabase';

// Role-based routing
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types/roles';
import { VCLayout } from './layouts/VCLayout';
import { AdminLayout } from './layouts/AdminLayout';

// VC Pages
import VCDashboard from './components/pages/vc/VCDashboard';
import VCStartups from './components/pages/vc/VCStartups';
import VCStartupDetail from './components/pages/vc/VCStartupDetail';

// Admin Pages
import AdminDashboard from './components/pages/admin/AdminDashboard';
import AdminStartups from './components/pages/admin/AdminStartups';
import AdminIntroRequests from './components/pages/admin/AdminIntroRequests';

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
      'Membership': '/membership',
      'Pricing': '/pricing',
      'Pitch Creator': '/pitch-creator',
      'Dashboard': '/dashboard',
      'Get Funded': '/get-funded',
      'saved-ideas': '/saved-ideas'
    };

    if (caseId) {
      navigate(`/case-studies/${caseId}`);
    } else {
      navigate(routeMap[page] || '/');
    }
  };

  const handleLogin = () => {
    // User is automatically logged in via Supabase/UserContext
    navigate('/');
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
      '/membership': 'Membership',
      '/pricing': 'Pricing',
      '/pitch-creator': 'Pitch Creator',
      '/dashboard': 'Dashboard',
      '/get-funded': 'Get Funded',
      '/saved-ideas': 'Saved Ideas'
    };

    // Handle case detail pages
    if (location.pathname.startsWith('/case-studies/')) {
      return 'Case Studies';
    }

    return pathMap[location.pathname] || 'Home';
  };

  // Check if we're in VC portal
  const isVCPortal = location.pathname.startsWith('/vc/');

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
        </Route>

        {/* VC PORTAL ROUTES (Separate Layout) */}
        <Route element={<VCLayout />}>
          <Route
            path="/vc/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/startups"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCStartups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/startups/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCStartupDetail />
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
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/auth" element={<AuthPage onNavigate={handleNavigate} onLogin={handleLogin} />} />
                  <Route path="/case-studies" element={<CaseStudiesPage onNavigate={handleNavigate} />} />
                  <Route path="/case-studies/:caseId" element={<CaseDetailPage onNavigate={handleNavigate} />} />
                  <Route path="/pricing" element={<PricingPage onNavigate={handleNavigate} />} />

                  {/* Founder Protected Routes */}
                  <Route
                    path="/community"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                        <CommunityPage onNavigate={handleNavigate} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resources"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                        <ResourcesPage />
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
                      <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                        <ProfilePage onNavigate={handleNavigate} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/membership"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                        <MembershipPage onNavigate={handleNavigate} />
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
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                        <DashboardPage onNavigate={handleNavigate} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/submit-startup"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                        <SubmitStartupPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/startups/:id"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                        <StartupDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/get-funded"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                        <VCConnectionPage onNavigate={handleNavigate} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/saved-ideas"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                        <SavedIdeasPage onNavigate={handleNavigate} />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
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

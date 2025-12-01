import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';

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

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
      'Get Funded': '/get-funded'
    };

    if (caseId) {
      navigate(`/case-studies/${caseId}`);
    } else {
      navigate(routeMap[page] || '/');
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
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
      '/get-funded': 'Get Funded'
    };

    // Handle case detail pages
    if (location.pathname.startsWith('/case-studies/')) {
      return 'Case Studies';
    }

    return pathMap[location.pathname] || 'Home';
  };

  return (
    <UserProvider>
      <div className="bg-background text-foreground min-h-screen">
        <Toaster position="top-right" />
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
            <Route path="/" element={<HomePage onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/community" element={<CommunityPage onNavigate={handleNavigate} />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/auth" element={<AuthPage onNavigate={handleNavigate} onLogin={handleLogin} />} />
            <Route path="/case-studies" element={<CaseStudiesPage onNavigate={handleNavigate} />} />
            <Route path="/case-studies/:caseId" element={<CaseDetailPage onNavigate={handleNavigate} />} />
            <Route path="/idea-analyser" element={<IdeaAnalyserPage onNavigate={handleNavigate} />} />
            <Route path="/profile" element={<ProfilePage onNavigate={handleNavigate} />} />
            <Route path="/membership" element={<MembershipPage onNavigate={handleNavigate} />} />
            <Route path="/pricing" element={<PricingPage onNavigate={handleNavigate} />} />
            <Route path="/pitch-creator" element={<PitchCreatorPage onNavigate={handleNavigate} />} />
            <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/get-funded" element={<VCConnectionPage onNavigate={handleNavigate} />} />
          </Routes>
        </main>
        <Footer onNavigate={handleNavigate} />

        {/* Chatbot - Available on all pages except Auth */}
        {location.pathname !== '/auth' && <Chatbot isDark={isDark} />}
      </div>
    </UserProvider>
  );
}

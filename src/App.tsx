import { useState, useEffect } from 'react';

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

type PageType =
  | 'Home'
  | 'Features'
  | 'Community'
  | 'Resources'
  | 'About'
  | 'Contact'
  | 'Auth'
  | 'Case Studies'
  | 'Idea Analyser'
  | 'CaseDetail'
  | 'Profile'
  | 'Settings'
  | 'Membership'
  | 'Pricing'
  | 'Pitch Creator'
  | 'Dashboard'
  | 'Get Funded';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('Home');
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleNavigate = (page: string, caseId?: string) => {
    setCurrentPage(page as PageType);
    if (caseId) {
      setCurrentCaseId(caseId);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('Home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('Home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'Home':
        return <HomePage onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />;
      case 'About':
        return <AboutPage />;
      case 'Features':
        return <FeaturesPage />;
      case 'Community':
        return <CommunityPage onNavigate={handleNavigate} />;
      case 'Resources':
        return <ResourcesPage />;
      case 'Contact':
        return <ContactPage />;
      case 'Auth':
        return <AuthPage onNavigate={handleNavigate} onLogin={handleLogin} />;
      case 'Case Studies':
        return <CaseStudiesPage onNavigate={handleNavigate} />;
      case 'CaseDetail':
        return <CaseDetailPage caseId={currentCaseId || undefined} onNavigate={handleNavigate} />;
      case 'Idea Analyser':
        return <IdeaAnalyserPage />;
      case 'Profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      case 'Membership':
        return <MembershipPage onNavigate={handleNavigate} />;
      case 'Pricing':
        return <PricingPage onNavigate={handleNavigate} />;
      case 'Pitch Creator':
        return <PitchCreatorPage onNavigate={handleNavigate} />;
      case 'Dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'Get Funded':
        return <VCConnectionPage onNavigate={handleNavigate} />;
      case 'Settings':
        return <ProfilePage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Toaster position="top-right" />
      <Navbar
        isDark={isDark}
        toggleTheme={toggleTheme}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
      <main>{renderPage()}</main>
      <Footer onNavigate={handleNavigate} />

      {/* Chatbot - Available on all pages except Auth */}
      {currentPage !== 'Auth' && <Chatbot isDark={isDark} />}
    </div>
  );
}

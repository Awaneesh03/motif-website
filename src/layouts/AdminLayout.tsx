import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Handshake,
  BookOpen,
  Lightbulb,
  Presentation,
  FolderOpen,
  LogOut,
  Menu,
} from 'lucide-react';

import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/components/NotificationBell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import '@/styles/admin.css';

const navGroups = [
  {
    label: 'Review',
    links: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
      { to: '/admin/startups', icon: Building2, label: 'Startups' },
      { to: '/admin/intro-requests', icon: Handshake, label: 'Intro Requests' },
    ],
  },
  {
    label: 'Content',
    links: [{ to: '/admin/case-studies', icon: BookOpen, label: 'Case Studies' }],
  },
  {
    label: 'Tools',
    links: [
      { to: '/admin/idea-analyser', icon: Lightbulb, label: 'Idea Analyser' },
      { to: '/admin/pitch-creator', icon: Presentation, label: 'Pitch Creator' },
      { to: '/admin/saved-ideas', icon: FolderOpen, label: 'Saved Ideas' },
    ],
  },
];

export const AdminLayout = () => {
  const { profile } = useUser();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const isActive = (to: string) =>
    location.pathname === to || (to !== '/admin/dashboard' && location.pathname.startsWith(to));

  const currentLabel =
    navGroups.flatMap(g => g.links).find(l => isActive(l.to))?.label ?? 'Overview';
  const initial = profile?.name?.charAt(0).toUpperCase() || 'A';

  const navigation = (onNavigate?: () => void) => (
    <>
      {navGroups.map(group => (
        <div key={group.label}>
          <p className="adm-nav__label">{group.label}</p>
          {group.links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onNavigate}
              className={`adm-nav__link${isActive(link.to) ? ' is-active' : ''}`}
              aria-current={isActive(link.to) ? 'page' : undefined}
            >
              <link.icon />
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </>
  );

  const accountFooter = (
    <div className="adm-sidebar__footer">
      <div className="adm-user">
        <div className="adm-avatar">{initial}</div>
        <div style={{ minWidth: 0 }}>
          <div className="adm-user__name">{profile?.name || 'Admin'}</div>
          <div className="adm-user__role">Administrator</div>
        </div>
      </div>
      <button type="button" className="adm-signout" onClick={handleLogout}>
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );

  const brand = (
    <Link to="/admin/dashboard" className="adm-brand">
      <span className="adm-brand__mark">M</span>
      <span className="adm-brand__name">Motif</span>
      <span className="adm-brand__tag">Admin</span>
    </Link>
  );

  return (
    <div id="admin-root" className="adm-shell">
      <aside className="adm-sidebar" aria-label="Admin navigation">
        {brand}
        <nav>{navigation()}</nav>
        {accountFooter}
      </aside>

      <div style={{ minWidth: 0 }}>
        <header className="adm-topbar">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="adm-mobile-only"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="adm-sheet p-4">
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {brand}
                <nav>{navigation(() => setMobileMenuOpen(false))}</nav>
                {accountFooter}
              </div>
            </SheetContent>
          </Sheet>

          <div className="adm-topbar__crumb">
            Admin <span aria-hidden="true">/</span> <strong>{currentLabel}</strong>
          </div>

          <div className="adm-topbar__actions">
            <NotificationBell variant="default" />
          </div>
        </header>

        <main>
          <ErrorBoundary
            fallback={
              <div className="adm-page">
                <div className="adm-panel" style={{ padding: 32, textAlign: 'center' }}>
                  <p className="adm-eyebrow">Something went wrong</p>
                  <h2 className="adm-title">This admin view failed to load</h2>
                  <p className="adm-subtitle">Try again, or return to the overview.</p>
                  <div
                    style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}
                  >
                    <Button onClick={() => window.location.reload()}>Try again</Button>
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = '/admin/dashboard')}
                    >
                      Go to overview
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
    </div>
  );
};

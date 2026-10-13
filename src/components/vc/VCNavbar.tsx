import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, Moon, Sun, LayoutDashboard, Building2, Layers, LogOut } from 'lucide-react';

import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface VCNavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const navLinks = [
  { label: 'Dashboard', href: '/vc/dashboard', icon: LayoutDashboard },
  { label: 'Startups', href: '/vc/startups', icon: Building2 },
  { label: 'Pipeline', href: '/vc/pipeline', icon: Layers },
];

export const VCNavbar = ({ isDark, toggleTheme }: VCNavbarProps) => {
  const { profile } = useUser();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);
  const initial = profile?.name?.charAt(0).toUpperCase() || 'V';

  return (
    <nav className="vc-nav">
      <div className="vc-nav__inner">
        <Link to="/vc/dashboard" className="vc-brand">
          Motif<span className="vc-brand__tag">Capital</span>
        </Link>

        <div className="vc-nav__links">
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={`vc-nav__link${isActive(link.href) ? ' is-active' : ''}`}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              <link.icon />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="vc-nav__actions">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="vc-icon-btn"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <NotificationBell variant="dark" />

          <div className="vc-user">
            <span className="vc-avatar">{initial}</span>
            <span className="vc-user__name">{profile?.name || 'Investor'}</span>
          </div>
          <button type="button" className="vc-signout" onClick={handleLogout}>
            <LogOut size={16} />
            <span className="vc-signout__label">Sign out</span>
          </button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="vc-icon-btn vc-mobile-only"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="vc-sheet p-0">
              <SheetHeader className="vc-sheet__head">
                <SheetTitle className="vc-brand">
                  Motif<span className="vc-brand__tag">Capital</span>
                </SheetTitle>
              </SheetHeader>
              <div className="vc-sheet__user">
                <span className="vc-avatar">{initial}</span>
                <div>
                  <div className="vc-user__name">{profile?.name || 'Investor'}</div>
                  <div className="vc-sheet__role">Verified investor</div>
                </div>
              </div>
              <div className="vc-sheet__links">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`vc-sheet__link${isActive(link.href) ? ' is-active' : ''}`}
                  >
                    <link.icon />
                    {link.label}
                  </Link>
                ))}
              </div>
              <button type="button" className="vc-signout vc-signout--sheet" onClick={handleLogout}>
                <LogOut size={16} />
                Sign out
              </button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

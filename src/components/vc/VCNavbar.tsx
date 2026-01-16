import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface VCNavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const VCNavbar = ({ isDark, toggleTheme }: VCNavbarProps) => {
  const { profile } = useUser();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const navLinks = [
    { label: 'Dashboard', href: '/vc/dashboard' },
    { label: 'Startups', href: '/vc/startups' },
    { label: 'Pending', href: '/vc/pending' },
  ];

  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/vc/dashboard" className="text-2xl font-bold text-gray-900">
            Motif
          </Link>

          {/* Right side - Notifications + Profile + Logout */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[260px] sm:w-[300px]">
                <div className="mt-8 flex flex-col gap-2">
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        location.pathname === link.href
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notification Bell */}
            <NotificationBell variant="dark" />

            {/* Profile Display */}
            <div className="hidden items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border md:flex">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {profile?.name?.charAt(0).toUpperCase() || 'V'}
                </span>
              </div>
              <span className="text-sm text-foreground">{profile?.name || 'VC Account'}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

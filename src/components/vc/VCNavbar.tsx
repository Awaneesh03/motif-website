import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, Moon, Sun, LayoutDashboard, Building2, Clock, LogOut } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
    { label: 'Dashboard', href: '/vc/dashboard', icon: LayoutDashboard },
    { label: 'Startups', href: '/vc/startups', icon: Building2 },
    { label: 'Pending', href: '/vc/pending', icon: Clock },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/vc/dashboard" className="text-2xl font-bold text-foreground">
              Motif
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notification Bell */}
            <NotificationBell variant="dark" />

            {/* Profile Display */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {profile?.name?.charAt(0).toUpperCase() || 'V'}
                </span>
              </div>
              <span className="text-sm text-foreground">{profile?.name || 'VC Account'}</span>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="rounded-lg"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notification Bell */}
            <NotificationBell variant="dark" />

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="text-left">VC Portal</SheetTitle>
                </SheetHeader>

                {/* Profile Section in Mobile */}
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {profile?.name?.charAt(0).toUpperCase() || 'V'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{profile?.name || 'VC Account'}</p>
                      <p className="text-xs text-muted-foreground">Verified Investor</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="p-4 flex flex-col gap-1">
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        location.pathname === link.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* Logout Button in Mobile */}
                <div className="p-4 mt-auto border-t border-border">
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full rounded-lg"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

import { Moon, Sun, Sparkles, User, Menu, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { NotificationBell } from './NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

interface NavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export function Navbar({
  isDark,
  toggleTheme,
  currentPage,
  onNavigate,
  isLoggedIn = false,
  onLogout,
}: NavbarProps) {
  const { profile, displayName } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const avatarInitial =
    profile?.name?.trim()?.charAt(0)?.toUpperCase() ||
    displayName?.trim()?.charAt(0)?.toUpperCase() ||
    'U';

  const avatarValue = profile?.avatar || '';
  const isAvatarUrl = avatarValue.startsWith('http://') || avatarValue.startsWith('https://') || avatarValue.startsWith('data:');

  // Navigation links change based on login state
  const navLinks = isLoggedIn
    ? ['Home', 'About', 'Case Studies', 'Community']
    : ['Home', 'Case Studies', 'Community', 'About'];

  return (
    <nav className="bg-background/80 border-border sticky top-0 z-50 border-b backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('Home')}
            className="transition-transform hover:scale-105 shrink-0"
          >
            <span className="text-gradient-lavender font-['Poppins'] text-2xl font-bold">
              Motif.
            </span>
          </button>

          {/* Center Navigation - Hidden on mobile */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map(link => (
              <button
                key={link}
                onClick={() => onNavigate(link)}
                className={`hover:text-primary transition-colors text-sm font-medium whitespace-nowrap ${
                  currentPage === link ? 'text-primary' : 'text-foreground/70'
                }`}
              >
                {link}
              </button>
            ))}

            {/* Separator */}
            <div className="h-5 w-px bg-border/50 mx-2" />

            {/* Highlighted Tools Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('Idea Analyser')}
                className={`hover:text-primary transition-all font-medium px-3 py-1.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 text-sm whitespace-nowrap ${
                  currentPage === 'Idea Analyser' ? 'text-primary bg-primary/10 border-primary/30' : 'text-foreground/80'
                }`}
              >
                Idea Analyser
              </button>

              <button
                onClick={() => onNavigate('Pitch Creator')}
                className={`hover:text-primary transition-all font-medium px-3 py-1.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 text-sm whitespace-nowrap ${
                  currentPage === 'Pitch Creator' ? 'text-primary bg-primary/10 border-primary/30' : 'text-foreground/80'
                }`}
              >
                Pitch Creator
              </button>

              {/* Get Funded - Premium Feature */}
              <button
                onClick={() => onNavigate('Get Funded')}
                className={`hover:text-primary transition-all font-medium px-3 py-1.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 text-sm whitespace-nowrap flex items-center gap-1.5 ${
                  currentPage === 'Get Funded' ? 'text-primary bg-primary/10 border-primary/30' : 'text-foreground/80'
                }`}
              >
                <DollarSign className="h-4 w-4 text-green-500" />
                Get Funded
              </button>
            </div>
          </div>

          {/* Right side - Mobile menu + Notifications + Theme toggle + Auth/Profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell - Only shown when logged in */}
            {isLoggedIn && <NotificationBell />}

            {/* Mobile Menu - Three Dots */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="mt-8 flex flex-col gap-3">
                  {navLinks.map(link => (
                    <button
                      key={link}
                      onClick={() => {
                        onNavigate(link);
                        setMobileMenuOpen(false);
                      }}
                      className={`hover:bg-accent rounded-lg px-4 py-3 text-left transition-colors text-sm font-medium ${
                        currentPage === link ? 'text-primary bg-accent' : 'text-foreground/70'
                      }`}
                    >
                      {link}
                    </button>
                  ))}

                  {/* Separator */}
                  <div className="h-px bg-border/50 my-3" />

                  {/* Highlighted Tools Section */}
                  <button
                    onClick={() => {
                      onNavigate('Idea Analyser');
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg px-4 py-3 text-left font-medium border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm ${
                      currentPage === 'Idea Analyser' ? 'text-primary bg-primary/10 border-primary/30' : 'text-foreground/80'
                    }`}
                  >
                    Idea Analyser
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('Pitch Creator');
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg px-4 py-3 text-left font-medium border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm ${
                      currentPage === 'Pitch Creator' ? 'text-primary bg-primary/10 border-primary/30' : 'text-foreground/80'
                    }`}
                  >
                    Pitch Creator
                  </button>

                  {/* Get Funded - Mobile */}
                  <button
                    onClick={() => {
                      onNavigate('Get Funded');
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg px-4 py-3 text-left font-medium border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm flex items-center gap-2 ${
                      currentPage === 'Get Funded' ? 'text-primary bg-primary/10 border-primary/30' : 'text-foreground/80'
                    }`}
                  >
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Get Funded
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={() => {
                        onLogout?.();
                        setMobileMenuOpen(false);
                      }}
                      className="hover:bg-accent text-foreground/70 rounded-lg px-4 py-3 text-left transition-colors text-sm font-medium"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full shrink-0">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* User Avatar/Login Button */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 shrink-0">
                    <Avatar className="h-8 w-8">
                      {isAvatarUrl ? (
                        <AvatarImage src={avatarValue} alt="User" />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {avatarValue && !isAvatarUrl ? (
                          <span className="text-lg">{avatarValue}</span>
                        ) : avatarInitial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => onNavigate('Profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="gradient-lavender shadow-lavender rounded-[16px] px-4 py-2 hover:opacity-90 shrink-0 h-9 text-sm font-medium"
                onClick={() => onNavigate('Auth')}
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Start for Free</span>
                <span className="sm:hidden">Start</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
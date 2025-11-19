import { Moon, Sun, Sparkles, User, MoreVertical } from 'lucide-react';
import { useState } from 'react';

import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation links change based on login state
  const navLinks = isLoggedIn
    ? ['Home', 'About', 'Case Studies', 'Community', 'Pricing']
    : ['Home', 'Case Studies', 'Community', 'Pricing', 'About'];

  return (
    <nav className="bg-background/80 border-border sticky top-0 z-50 border-b backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('Home')}
            className="transition-transform hover:scale-105"
          >
            <span className="text-gradient-lavender font-['Poppins'] text-2xl font-bold">
              Motif.
            </span>
          </button>

          {/* Center Navigation - Hidden on mobile */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(link => (
              <button
                key={link}
                onClick={() => onNavigate(link)}
                className={`hover:text-primary transition-colors ${
                  currentPage === link ? 'text-primary' : 'text-foreground/70'
                }`}
              >
                {link}
              </button>
            ))}

            {/* Separator */}
            <div className="h-6 w-px bg-border/50" />

            {/* Highlighted Tools Section */}
            <button
              onClick={() => onNavigate('Idea Analyser')}
              className={`hover:text-primary transition-all font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 shadow-sm hover:shadow-md ${
                currentPage === 'Idea Analyser' ? 'text-primary ring-2 ring-primary/20' : 'text-foreground'
              }`}
            >
              Idea Analyser
            </button>

            <button
              onClick={() => onNavigate('Pitch Creator')}
              className={`hover:text-primary transition-all font-medium px-4 py-2 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 ${
                currentPage === 'Pitch Creator' ? 'text-primary bg-primary/10 border-primary/30' : 'text-foreground/80'
              }`}
            >
              Pitch Creator
            </button>
          </div>

          {/* Right side - Mobile menu + Theme toggle + Auth/Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu - Three Dots */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full md:hidden">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                <div className="mt-8 flex flex-col gap-4">
                  {navLinks.map(link => (
                    <button
                      key={link}
                      onClick={() => {
                        onNavigate(link);
                        setMobileMenuOpen(false);
                      }}
                      className={`hover:bg-accent rounded-lg px-4 py-2 text-left transition-colors ${
                        currentPage === link ? 'text-primary bg-accent' : 'text-foreground/70'
                      }`}
                    >
                      {link}
                    </button>
                  ))}

                  {/* Separator */}
                  <div className="h-px bg-border/50 my-2" />

                  {/* Highlighted Tools Section */}
                  <button
                    onClick={() => {
                      onNavigate('Idea Analyser');
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg px-4 py-2 text-left font-semibold bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 transition-colors ${
                      currentPage === 'Idea Analyser' ? 'text-primary ring-2 ring-primary/20' : 'text-foreground'
                    }`}
                  >
                    Idea Analyser
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('Pitch Creator');
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg px-4 py-2 text-left font-medium border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors ${
                      currentPage === 'Pitch Creator' ? 'text-primary bg-primary/10 border-primary/30' : 'text-foreground/80'
                    }`}
                  >
                    Pitch Creator
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={() => {
                        onLogout?.();
                        setMobileMenuOpen(false);
                      }}
                      className="hover:bg-accent text-foreground/70 rounded-lg px-4 py-2 text-left transition-colors"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Theme Toggle */}
            {!isDark && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                <Moon className="h-5 w-5" />
              </Button>
            )}
            {isDark && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                <Sun className="h-5 w-5" />
              </Button>
            )}

            {/* User Avatar/Login Button - Hidden on small mobile */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                        alt="User"
                      />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => onNavigate('Profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('Membership')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Your Plan</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="gradient-lavender shadow-lavender rounded-[16px] px-4 hover:opacity-90 sm:px-6"
                onClick={() => onNavigate('Auth')}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span className="xs:inline hidden">Start for Free</span>
                <span className="xs:hidden">Start</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

import { Linkedin, Instagram, Twitter, Mail } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-muted/30 border-border mt-20 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo + Tagline */}
          <div>
            <h3 className="text-gradient-lavender mb-4 font-['Poppins'] text-2xl font-bold">
              Motif.
            </h3>
            <p className="text-muted-foreground mb-4">
              AI-powered platform helping founders validate and launch successful startups.
            </p>
            <a
              href="mailto:teammotif.ai@gmail.com"
              className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm">teammotif.ai@gmail.com</span>
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {['Home', 'Case Studies', 'Idea Analyser', 'Community', 'Resources', 'About'].map(
                link => (
                  <button
                    key={link}
                    onClick={() => onNavigate(link)}
                    className="text-muted-foreground hover:text-primary text-left text-sm transition-colors"
                  >
                    {link}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="mb-4">Features</h4>
            <div className="flex flex-col gap-2">
              {['Pitch Creator', 'Contact', 'Resources'].map(link => (
                <button
                  key={link}
                  onClick={() => onNavigate(link)}
                  className="text-muted-foreground hover:text-primary text-left text-sm transition-colors"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground transition-all duration-300 hover:scale-110 hover:text-[#0A66C2]"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/official_motif/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-all duration-300 hover:scale-110 hover:text-[#E4405F]"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground transition-all duration-300 hover:scale-110 hover:text-[#1DA1F2]"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-8 border-t pt-8 text-center text-sm">
          © {new Date().getFullYear()} Motif. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

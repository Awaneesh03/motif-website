import { Linkedin, Instagram, Mail } from 'lucide-react';

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
              href="mailto:support@motif.com"
              className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm">support@motif.com</span>
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Idea Analyser', key: 'Idea Analyser' },
                { label: 'Pitch Generator', key: 'Pitch Creator' },
                { label: 'Get Funded', key: 'Get Funded' },
                { label: 'Home', key: 'Home' },
                { label: 'Case Study', key: 'Case Studies' },
                { label: 'Community', key: 'Community' },
                { label: 'Resource', key: 'Resources' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.key)}
                  className="text-muted-foreground hover:text-primary text-left text-sm transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="mb-4">Features</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Idea Analyser', key: 'Idea Analyser' },
                { label: 'Pitch Generator', key: 'Pitch Creator' },
                { label: 'Get Funded', key: 'Get Funded' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.key)}
                  className="text-muted-foreground hover:text-primary text-left text-sm transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="mailto:support@motif.com"
                className="text-muted-foreground transition-all duration-300 hover:scale-110"
                style={{
                  color: 'hsl(var(--muted-foreground))',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#EA4335'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                title="Email Us"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground transition-all duration-300 hover:scale-110"
                style={{
                  color: 'hsl(var(--muted-foreground))',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0A66C2'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                title="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground transition-all duration-300 hover:scale-110"
                style={{
                  color: 'hsl(var(--muted-foreground))',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#E4405F'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                title="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-8 border-t pt-8 text-center text-sm">
          © 2025 Motif. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

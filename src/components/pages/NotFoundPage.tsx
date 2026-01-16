import { motion } from 'motion/react';
import { Home, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface NotFoundPageProps {
  onNavigate?: (page: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="glass-surface border-border/50">
          <CardContent className="pt-12 pb-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-8"
            >
              <div className="text-9xl font-bold text-gradient-lavender">404</div>
            </motion.div>

            <h1 className="mb-4 text-3xl font-bold">Page Not Found</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
                onClick={() => onNavigate?.('Home')}
              >
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl"
                onClick={() => onNavigate?.('Idea Analyser')}
              >
                <Search className="mr-2 h-5 w-5" />
                Explore Ideas
              </Button>
            </div>

            <div className="mt-12 pt-8 border-t border-border/50">
              <p className="text-muted-foreground text-sm mb-4">
                Looking for something specific? Try these popular pages:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Dashboard', 'Idea Analyser', 'Pitch Creator', 'Community', 'Case Studies'].map((page) => (
                  <Button
                    key={page}
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => onNavigate?.(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

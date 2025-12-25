import { motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface MembershipPageProps {
  onNavigate?: (page: string) => void;
}

export function MembershipPage({ onNavigate }: MembershipPageProps) {

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="gradient-lavender relative overflow-hidden py-16">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-6 font-['Poppins'] text-4xl text-white md:text-5xl">
              All Features Free
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-white/90">
              Enjoy unlimited access to all platform features at no cost
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl"
          >
            <Card className="border-primary/50 shadow-primary/20 border-2 shadow-2xl">
              <CardHeader className="pb-6 pt-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="gradient-lavender shadow-lavender rounded-2xl p-4">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="mb-2 text-3xl">Everything Included</CardTitle>
                <p className="text-muted-foreground mb-4">
                  No hidden fees, no subscriptions - just great features
                </p>
                <div className="mb-2">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-2">/ forever</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features List */}
                <div className="space-y-3">
                  {[
                    'Unlimited case studies access',
                    'Advanced AI idea validation',
                    'Full community access',
                    'Unlimited idea saves',
                    'All features included',
                    'Email support',
                    'Regular platform updates',
                    'Custom workspace organization',
                    'Detailed analytics & insights',
                    'Export your analysis reports',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className="rounded-full bg-primary/10 p-1">
                          <Check className="text-primary h-4 w-4" />
                        </div>
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  className="gradient-lavender shadow-lavender w-full rounded-[16px] hover:opacity-90"
                  onClick={() => onNavigate?.('Dashboard')}
                >
                  Get Started Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <Card className="border-border/50 mx-auto max-w-3xl shadow-lg">
              <CardContent className="p-8">
                <h3 className="mb-4">Ready to Get Started?</h3>
                <p className="text-muted-foreground mb-6">
                  Join our community of founders and entrepreneurs. All features are completely free - no credit card required, no hidden fees.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    className="gradient-lavender shadow-lavender rounded-[16px] px-6 hover:opacity-90"
                    onClick={() => onNavigate?.('Dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-[16px] px-6"
                    onClick={() => onNavigate?.('Community')}
                  >
                    Join Community
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

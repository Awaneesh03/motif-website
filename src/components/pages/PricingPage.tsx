import { motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PricingPageProps {
  onNavigate?: (page: string) => void;
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-gradient-lavender mb-4">All Features Free</h1>
            <p className="text-muted-foreground mx-auto mb-8 max-w-2xl">
              No hidden fees, no subscriptions - enjoy unlimited access to all features at no cost
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
              <CardHeader className="pb-6 pt-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="gradient-lavender shadow-lavender rounded-2xl p-6">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardTitle className="mb-4 text-4xl">Everything Included</CardTitle>
                <p className="text-muted-foreground mb-6 text-lg">
                  No credit card required - just sign up and start building
                </p>
                <div className="mb-6">
                  <span className="text-6xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-3 text-xl">/ forever</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-8 px-8 pb-8">
                {/* Features List */}
                <div className="space-y-4">
                  {[
                    'Unlimited AI idea analyses',
                    'Unlimited case studies access',
                    'Advanced pitch creator with AI',
                    'Full community access',
                    'Unlimited idea saves',
                    'AI mentor assistant (24/7)',
                    'Download reports as PDF',
                    'Email support',
                    'Regular platform updates',
                    'Custom workspace organization',
                    'Detailed analytics & insights',
                    'Export all your data',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="mt-1">
                        <div className="rounded-full bg-primary/10 p-1.5">
                          <Check className="text-primary h-5 w-5" />
                        </div>
                      </div>
                      <span className="text-base">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  className="gradient-lavender shadow-lavender h-14 w-full rounded-[16px] text-lg hover:opacity-90"
                  onClick={() => onNavigate?.('Dashboard')}
                >
                  Get Started Now - It's Free!
                </Button>

                <p className="text-muted-foreground text-center text-sm">
                  Join thousands of founders and entrepreneurs building their next big idea
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

import { motion } from 'motion/react';
import { useState } from 'react';
import { Check, Sparkles, Zap } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const plans = [
  {
    id: 'free',
    name: 'Free Plan',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Access to 5 case studies per month',
      'Basic idea validation',
      'Community access',
      'Save up to 10 ideas',
      'Email support',
    ],
    limitations: ['Limited AI analysis', 'No priority support', 'Basic features only'],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: '$29',
    period: 'per month',
    description: 'For serious founders and entrepreneurs',
    features: [
      'Unlimited case studies access',
      'Advanced AI idea validation',
      'Priority community access',
      'Unlimited idea saves',
      'Early access to new features',
      'Priority email & chat support',
      'Exclusive webinars & workshops',
      'Custom workspace organization',
      'Detailed analytics & insights',
      'Export your analysis reports',
    ],
    cta: 'Upgrade to Premium',
    highlighted: true,
  },
];

interface MembershipPageProps {
  onNavigate?: (page: string) => void;
}

export function MembershipPage({ onNavigate }: MembershipPageProps) {
  const [activePlan, setActivePlan] = useState('free');

  const handleSubscribe = (planId: string) => {
    if (planId === activePlan) return;
    // Simulate subscription
    setActivePlan(planId);
    alert(`Subscribed to ${plans.find(p => p.id === planId)?.name}!`);
  };

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
              Choose Your Plan
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-white/90">
              Select the perfect plan for your startup journey
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={`relative h-full border-2 transition-all ${
                    plan.highlighted
                      ? 'border-primary shadow-primary/20 scale-105 shadow-2xl'
                      : 'border-border/50 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {/* Active Badge */}
                  {activePlan === plan.id && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-lavender shadow-lavender rounded-full px-4 py-1 text-white">
                        Active Plan
                      </Badge>
                    </div>
                  )}

                  {/* Popular Badge */}
                  {plan.highlighted && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-secondary text-secondary-foreground rounded-full px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-6 pt-6 text-center">
                    <div className="mb-4 flex justify-center">
                      {plan.highlighted ? (
                        <div className="gradient-lavender shadow-lavender rounded-2xl p-4">
                          <Zap className="h-8 w-8 text-white" />
                        </div>
                      ) : (
                        <div className="bg-muted rounded-2xl p-4">
                          <Sparkles className="text-muted-foreground h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="mb-2 text-2xl">{plan.name}</CardTitle>
                    <p className="text-muted-foreground mb-4">{plan.description}</p>
                    <div className="mb-2">
                      <span className="text-4xl">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Features List */}
                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div
                              className={`rounded-full p-1 ${
                                plan.highlighted ? 'bg-primary/10' : 'bg-muted'
                              }`}
                            >
                              <Check
                                className={`h-4 w-4 ${
                                  plan.highlighted ? 'text-primary' : 'text-muted-foreground'
                                }`}
                              />
                            </div>
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={`w-full rounded-[16px] ${
                        plan.highlighted
                          ? 'gradient-lavender shadow-lavender hover:opacity-90'
                          : activePlan === plan.id
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'border-primary text-primary hover:bg-primary/10 border-2'
                      }`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={activePlan === plan.id}
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      {activePlan === plan.id ? 'Current Plan' : plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <Card className="border-border/50 mx-auto max-w-3xl shadow-lg">
              <CardContent className="p-8">
                <h3 className="mb-4">Need help choosing?</h3>
                <p className="text-muted-foreground mb-6">
                  Not sure which plan is right for you? We're here to help! Contact our team for
                  personalized recommendations based on your startup goals.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    variant="outline"
                    className="rounded-[16px] px-6"
                    onClick={() => onNavigate?.('Contact')}
                  >
                    Contact Sales
                  </Button>
                  <Button
                    className="gradient-lavender shadow-lavender rounded-[16px] px-6 hover:opacity-90"
                    onClick={() => onNavigate?.('Community')}
                  >
                    Join Community
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FAQ Section */}
          <section className="bg-background pt-8 pb-12 md:pt-10 md:pb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                Common questions about our membership plans
              </p>
            </motion.div>

            <Accordion type="single" collapsible className="w-full">
              <div className="grid md:grid-cols-2 gap-3 md:gap-4 items-start">
                <div className="space-y-2">
                  <AccordionItem value="item-1" className="border rounded-lg px-4 border-b-border">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      Can I switch plans anytime?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border rounded-lg px-4 border-b-border">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      What payment methods do you accept?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      We accept all major credit cards, PayPal, and bank transfers for annual plans.
                    </AccordionContent>
                  </AccordionItem>
                </div>

                <div className="space-y-2">
                  <AccordionItem value="item-3" className="border rounded-lg px-4 border-b-border">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      Is there a free trial for Premium?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      Yes! New users get a 14-day free trial of the Premium plan with full access to all features.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border rounded-lg px-4 border-b-border">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      Can I cancel anytime?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      Absolutely. You can cancel your subscription at any time with no cancellation fees.
                    </AccordionContent>
                  </AccordionItem>
                </div>
              </div>
            </Accordion>
          </section>
        </div>
      </section>
    </div>
  );
}

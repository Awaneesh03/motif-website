import { motion } from 'motion/react';
import { Check, Sparkles, Zap, Crown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface PricingPageProps {
  onNavigate?: (page: string) => void;
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Free',
      icon: Sparkles,
      price: billingPeriod === 'monthly' ? '0' : '0',
      period: 'forever',
      description: 'Perfect for exploring and getting started',
      features: [
        '5 AI idea analyses per month',
        'Access to community ideas',
        '3 case studies per month',
        'Basic pitch templates',
        'Community support',
      ],
      cta: 'Get Started',
      popular: false,
      ctaVariant: 'outline' as const,
    },
    {
      name: 'Premium',
      icon: Crown,
      price: billingPeriod === 'monthly' ? '29' : '290',
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      savings: billingPeriod === 'annual' ? 'Save $58/year' : null,
      description: 'For serious founders ready to build',
      features: [
        'Unlimited AI idea analyses',
        'Unlimited case studies',
        'Advanced pitch creator',
        'AI mentor assistant (24/7)',
        'Priority community features',
        'Download all reports as PDF',
        'Early access to new features',
        '1-on-1 founder consultation',
      ],
      cta: 'Upgrade to Premium',
      popular: true,
      ctaVariant: 'default' as const,
    },
  ];

  const faqs = [
    {
      question: "What's included in the Free plan?",
      answer:
        "The Free plan includes 5 AI idea analyses per month, access to community ideas, 3 case studies per month, basic pitch templates, and community support. It's perfect for exploring the platform and getting started with idea validation.",
    },
    {
      question: 'Can I upgrade anytime?',
      answer:
        "Yes! You can upgrade from Free to Premium at any time. Your upgraded features will be available immediately, and you'll be charged on a prorated basis if you're switching mid-cycle.",
    },
    {
      question: 'How do credits work?',
      answer:
        'Credits are used for AI analyses and advanced features. Free users get 5 credits per month, while Premium users get unlimited credits. Credits reset at the beginning of each billing cycle.',
    },
    {
      question: 'What happens if I cancel Premium?',
      answer:
        "If you cancel Premium, you'll continue to have access to Premium features until the end of your current billing period. After that, your account will revert to the Free plan, and you'll keep all your saved data and progress.",
    },
    {
      question: 'Do you offer student discounts?',
      answer:
        'Yes! We offer a 50% discount for students and educators. Please contact our support team with your valid student ID or educational institution email to receive your discount code.',
    },
  ];

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
            <h1 className="text-gradient-lavender mb-4">Simple, Transparent Pricing</h1>
            <p className="text-muted-foreground mx-auto mb-8 max-w-2xl">
              Choose the plan that's right for you. No hidden fees, cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="bg-muted/50 inline-flex items-center gap-4 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`rounded-full px-6 py-2 transition-all ${
                  billingPeriod === 'monthly'
                    ? 'gradient-lavender shadow-lavender text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`rounded-full px-6 py-2 transition-all ${
                  billingPeriod === 'annual'
                    ? 'gradient-lavender shadow-lavender text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
                <Badge className="ml-2 border-0 bg-[#A9F5D0] text-[#0E1020]">Save 17%</Badge>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={plan.popular ? 'md:scale-105' : ''}
              >
                <Card
                  className={`glass-surface border-border/50 hover:shadow-lavender relative h-full transition-all ${
                    plan.popular ? 'border-primary/50' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-lavender shadow-lavender border-0 px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-8">
                    {/* Plan Header */}
                    <div className="mb-6 text-center">
                      <div className="gradient-lavender mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                        <plan.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mb-2">{plan.name}</h3>
                      <p className="text-muted-foreground mb-4 text-sm">{plan.description}</p>
                      <div className="mb-2">
                        <span className="text-5xl">${plan.price}</span>
                        <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                      </div>
                      {plan.savings && (
                        <Badge variant="outline" className="border-[#A9F5D0] text-[#A9F5D0]">
                          {plan.savings}
                        </Badge>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="mb-8 space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      variant={plan.ctaVariant}
                      className={`h-12 w-full rounded-xl ${
                        plan.popular ? 'gradient-lavender shadow-lavender hover:opacity-90' : ''
                      }`}
                      onClick={() => onNavigate?.(plan.name === 'Free' ? 'Auth' : 'Membership')}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-background pt-8 pb-12 md:pt-10 md:pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Everything you need to know about our pricing and plans
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full">
            <div className="grid md:grid-cols-2 gap-3 md:gap-4 items-start">
              <div className="space-y-2">
                {faqs.slice(0, 3).map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 border-b-border">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
              <div className="space-y-2">
                {faqs.slice(3).map((faq, index) => (
                  <AccordionItem key={index + 3} value={`item-${index + 3}`} className="border rounded-lg px-4 border-b-border">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            </div>
          </Accordion>

          {/* Help CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-12 text-center"
          >
            <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
              <CardContent className="p-8">
                <HelpCircle className="text-primary mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2">Need more help?</h3>
                <p className="text-muted-foreground mb-6">
                  Our support team is here to answer any questions you might have
                </p>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => onNavigate?.('Contact')}
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

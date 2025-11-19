import { motion } from 'motion/react';
import { useState } from 'react';
import {
  Rocket,
  Target,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
  Zap,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  MessageCircle,
  FileText,
  Star,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

interface VCConnectionPageProps {
  onNavigate?: (page: string) => void;
}

export function VCConnectionPage({ onNavigate }: VCConnectionPageProps) {
  const [qualificationOpen, setQualificationOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [qualificationForm, setQualificationForm] = useState({
    name: '',
    email: '',
    ideaDescription: '',
    stage: '',
    traction: '',
    fundingAmount: '',
  });

  const handleQualificationSubmit = () => {
    // Simulated submission
    setQualificationOpen(false);
    // Would normally navigate to qualification results
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-lavender relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-white/20 px-4 py-1 text-white">
              💰 VC Connection Layer
            </Badge>
            <h1 className="mb-6 text-4xl font-bold text-white md:text-6xl">
              Turn Your Validated Idea
              <br />
              Into a Funded Startup
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-white/90">
              Motif connects high-potential founders with venture capital investors actively seeking
              new opportunities. We pre-qualify your idea, then introduce you to VCs whose thesis
              aligns with your vision.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Dialog open={qualificationOpen} onOpenChange={setQualificationOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="rounded-[16px] bg-white px-8 text-lg text-primary shadow-xl hover:bg-white/90"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Check If You Qualify
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Qualification Assessment</DialogTitle>
                    <DialogDescription>
                      Tell us about your idea. We'll evaluate it against our 5-pillar framework and
                      let you know if you're ready for VC introductions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={qualificationForm.name}
                        onChange={e =>
                          setQualificationForm({ ...qualificationForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={qualificationForm.email}
                        onChange={e =>
                          setQualificationForm({ ...qualificationForm, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idea">One-Sentence Pitch (max 140 chars)</Label>
                      <Input
                        id="idea"
                        placeholder="We help X do Y using Z"
                        maxLength={140}
                        value={qualificationForm.ideaDescription}
                        onChange={e =>
                          setQualificationForm({
                            ...qualificationForm,
                            ideaDescription: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {qualificationForm.ideaDescription.length}/140
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stage">Current Stage</Label>
                      <select
                        id="stage"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={qualificationForm.stage}
                        onChange={e =>
                          setQualificationForm({ ...qualificationForm, stage: e.target.value })
                        }
                      >
                        <option value="">Select stage</option>
                        <option value="idea">Idea Only</option>
                        <option value="prototype">Prototype/MVP</option>
                        <option value="beta">Beta Users</option>
                        <option value="revenue">Generating Revenue</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="traction">Traction (users, revenue, growth)</Label>
                      <Textarea
                        id="traction"
                        placeholder="e.g., 500 beta users, $5K MRR, 20% MoM growth"
                        rows={3}
                        value={qualificationForm.traction}
                        onChange={e =>
                          setQualificationForm({ ...qualificationForm, traction: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="funding">Funding Amount Seeking</Label>
                      <select
                        id="funding"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={qualificationForm.fundingAmount}
                        onChange={e =>
                          setQualificationForm({
                            ...qualificationForm,
                            fundingAmount: e.target.value,
                          })
                        }
                      >
                        <option value="">Select amount</option>
                        <option value="100k-500k">$100K - $500K</option>
                        <option value="500k-1m">$500K - $1M</option>
                        <option value="1m-2m">$1M - $2M</option>
                        <option value="2m+">$2M+</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setQualificationOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleQualificationSubmit}
                      className="gradient-lavender text-white"
                    >
                      Submit Assessment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                size="lg"
                variant="outline"
                className="rounded-[16px] border-white px-8 text-lg text-white hover:bg-white/10"
              >
                How It Works
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>12 founders funded in Q4 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Connected to 40+ active VCs</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>34% intro-to-meeting rate</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem We Solve */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4">The Problem We Solve</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Getting funded shouldn't depend on who you know
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* For Founders */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="text-destructive h-6 w-6" />
                    For Founders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-destructive" />
                    <p className="text-sm">
                      You've validated your idea but don't have investor connections
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-destructive" />
                    <p className="text-sm">Cold emailing VCs gets ignored (2% response rate)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-destructive" />
                    <p className="text-sm">
                      Warm introductions are gatekept by who you know, not what you've built
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-destructive" />
                    <p className="text-sm">Accelerators reject 98% of applicants</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-destructive" />
                    <p className="text-sm">You waste months networking instead of building</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* For VCs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="text-secondary h-6 w-6" />
                    For VCs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-secondary" />
                    <p className="text-sm">500+ cold emails per week, mostly unqualified</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-secondary" />
                    <p className="text-sm">
                      Entrepreneurs pitch solutions to non-existent problems
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-secondary" />
                    <p className="text-sm">No standardized evaluation = wasted partner time</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-secondary" />
                    <p className="text-sm">Miss great founders outside their network</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-secondary" />
                    <p className="text-sm">Time-consuming manual filtering and outreach</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <Card className="gradient-lavender border-none text-white">
              <CardContent className="p-8 text-center">
                <h3 className="mb-4 text-2xl font-bold">What Motif Does</h3>
                <p className="mx-auto max-w-3xl text-lg">
                  We pre-qualify founders using our Idea Validation Engine, then introduce only
                  investment-ready companies to VCs seeking opportunities in their thesis. Higher
                  signal, less noise, better matches.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 5-Pillar Framework */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4">Our 5-Pillar Investment Readiness Framework</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Every idea is scored 0-100 across five dimensions. You need 75+ to qualify.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Target,
                title: 'Market Validation',
                description: 'Problem clarity, market size (TAM/SAM/SOM), and competitive analysis',
                weight: '0-100',
                color: 'text-primary',
              },
              {
                icon: TrendingUp,
                title: 'Traction Signals',
                description: 'User interviews, waitlist, beta testers, revenue, and growth metrics',
                weight: '0-100',
                color: 'text-secondary',
              },
              {
                icon: Users,
                title: 'Founder Credibility',
                description: 'Domain expertise, execution capability, team composition, LinkedIn verified',
                weight: '0-100',
                color: 'text-green-500',
              },
              {
                icon: DollarSign,
                title: 'Business Model Clarity',
                description: 'Revenue model, unit economics, go-to-market strategy, financial projections',
                weight: '0-100',
                color: 'text-yellow-500',
              },
              {
                icon: FileText,
                title: 'Pitch Quality',
                description: 'Deck structure, problem/solution fit, clear ask with specific use of funds',
                weight: '0-100',
                color: 'text-purple-500',
              },
            ].map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`mb-4 ${pillar.color}`}>
                      <pillar.icon className="h-10 w-10" />
                    </div>
                    <h3 className="mb-2 font-semibold">{pillar.title}</h3>
                    <p className="text-muted-foreground mb-4 text-sm">{pillar.description}</p>
                    <Badge variant="outline" className="font-mono">
                      Score: {pillar.weight}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4">
                  <Shield className="text-primary h-8 w-8" />
                  <div className="text-left">
                    <p className="font-semibold">Minimum Qualifying Score: 350/500 (70%)</p>
                    <p className="text-muted-foreground text-sm">
                      You'll see your score breakdown and improvement recommendations before
                      submitting
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How Founders Qualify - Workflow */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4">How It Works: Founder Journey</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              From qualification to VC introduction in 5-7 business days
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: 'Build Your Idea Profile',
                description:
                  'Complete Idea Analyser assessment, submit pitch deck, provide traction evidence',
                timeline: '30-45 minutes',
                icon: FileText,
              },
              {
                step: 2,
                title: 'Motif Review',
                description:
                  'Automated scoring + human review by investment analysts. Pass/Fail decision with detailed feedback',
                timeline: '48-hour turnaround',
                icon: BarChart3,
              },
              {
                step: 3,
                title: 'VC Matching',
                description:
                  'We match you with 3-5 VCs whose thesis aligns with your space. You approve the list before introductions',
                timeline: '2-3 days',
                icon: Users,
              },
              {
                step: 4,
                title: 'Introduction & Handoff',
                description:
                  'Double opt-in email intro with your profile, deck, and Motif endorsement',
                timeline: 'Within 24 hours of payment',
                icon: MessageCircle,
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="gradient-lavender flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-xl font-semibold">{step.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="mr-1 h-3 w-3" />
                            {step.timeline}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                      <step.icon className="text-primary h-8 w-8 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-muted/30 py-16" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Pay only when we deliver introductions. No equity. No success fees.
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                name: 'Standard',
                price: '$499',
                description: 'Perfect for first-time founders',
                features: [
                  'Up to 3 VC introductions',
                  '1 submission review',
                  'Basic profile listing',
                  'Email support',
                  '60-day money-back guarantee',
                ],
                cta: 'Get Started',
                popular: false,
              },
              {
                name: 'Premium',
                price: '$899',
                description: 'Best for serious founders',
                features: [
                  'Up to 5 VC introductions',
                  '2 submission reviews',
                  'Featured profile placement',
                  '1-hour pitch coaching',
                  'Priority matching (3-day turnaround)',
                  '60-day money-back guarantee',
                ],
                cta: 'Most Popular',
                popular: true,
              },
              {
                name: 'Accelerated',
                price: '$1,499',
                description: 'Maximum support & exposure',
                features: [
                  'Up to 10 VC introductions',
                  'Unlimited resubmissions (90 days)',
                  'Dedicated analyst review',
                  '3 pitch coaching sessions',
                  'Investor Q&A prep',
                  'Follow-up email templates',
                  'Priority support',
                ],
                cta: 'Premium Access',
                popular: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative h-full transition-all hover:shadow-xl ${
                    plan.popular
                      ? 'gradient-lavender border-none text-white'
                      : 'hover:border-primary/30'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-500 px-4 py-1 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                    </div>
                    <p className={`mt-2 text-sm ${plan.popular ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="mb-6 space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle
                            className={`mt-0.5 h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-primary'}`}
                          />
                          <span className={`text-sm ${plan.popular ? 'text-white' : ''}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full rounded-xl ${
                        plan.popular
                          ? 'bg-white text-primary hover:bg-white/90'
                          : 'gradient-lavender text-white'
                      }`}
                      onClick={() => setSelectedPlan(plan.name)}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-semibold">Add-On Services</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="font-semibold">Additional Introductions</p>
                    <p className="text-muted-foreground text-sm">$199 each</p>
                  </div>
                  <div>
                    <p className="font-semibold">Pitch Deck Teardown</p>
                    <p className="text-muted-foreground text-sm">$299</p>
                  </div>
                  <div>
                    <p className="font-semibold">Financial Model Review</p>
                    <p className="text-muted-foreground text-sm">$399</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <Shield className="text-primary mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-4">Trust & Safety</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Our commitments to founders and investors
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>To Founders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">We will never share your idea without permission</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">You own your IP, always. No equity stake required</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">Transparent rejection reasons with improvement roadmap</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    Money-back guarantee if zero VCs respond within 60 days
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>To VCs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-secondary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">We verify founder identities (LinkedIn, email, phone)</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-secondary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">Screen out idea thieves and serial submitters</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-secondary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">Honor your capacity limits and preferences</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-secondary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">No spam, ever. Quality over quantity</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  <strong>Legal Disclaimer:</strong> Motif is a technology platform that facilitates
                  introductions between founders and venture capital investors. We are not a
                  registered broker-dealer, investment adviser, or funding portal under the
                  Securities Act of 1933. Introductions do not constitute investment recommendations.
                  Founders are responsible for compliance with federal and state securities laws.
                  Past performance of connected companies does not guarantee future results. Motif
                  does not guarantee funding outcomes.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4">Success Stories</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Founders who got funded through Motif's VC Connection Layer
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Sarah Chen',
                company: 'DataPulse AI',
                amount: '$1.2M',
                quote:
                  'Motif connected me to 5 VCs. Got meetings with 3. Closed a seed round in 45 days.',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
              },
              {
                name: 'Marcus Rodriguez',
                company: 'HealthFlow',
                amount: '$800K',
                quote:
                  'Their evaluation process forced me to sharpen my pitch. The VCs they matched me with were perfectly aligned.',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
              },
              {
                name: 'Emily Patel',
                company: 'EcoTrack',
                amount: '$2M',
                quote:
                  "I'd been cold emailing for months with zero responses. Motif got me 4 meetings in 2 weeks.",
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
              },
            ].map((story, index) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold">{story.name}</p>
                        <p className="text-muted-foreground text-sm">{story.company}</p>
                      </div>
                    </div>
                    <div className="mb-3 flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="text-primary h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm italic">"{story.quote}"</p>
                    <Badge className="gradient-lavender border-none text-white">
                      Raised {story.amount}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4">Frequently Asked Questions</h2>
          </motion.div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What if VCs don't respond?</AccordionTrigger>
              <AccordionContent>
                Our money-back guarantee covers this. If zero VCs respond within 60 days, you get a
                full refund. We also track each VC's response rate and prioritize those who
                consistently engage.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Can I choose which VCs to be introduced to?</AccordionTrigger>
              <AccordionContent>
                Yes. We suggest 5-10 matches based on your industry and stage, but you approve the
                final list before any introductions are sent. You're in complete control.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>What if I'm pre-revenue?</AccordionTrigger>
              <AccordionContent>
                Pre-revenue is fine if you have strong traction signals like beta users, letters of
                intent, or a significant waitlist. VCs invest in potential, not just current revenue.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Do I need a prototype?</AccordionTrigger>
              <AccordionContent>
                Not strictly required, but it significantly increases your qualification score. VCs
                want to see execution capability. Even a simple MVP or clickable prototype shows
                you're serious.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>How do you prevent idea theft?</AccordionTrigger>
              <AccordionContent>
                VCs are vetted investors with reputations to protect. Idea theft is exceptionally
                rare in the VC world. If you're still concerned, you can request an NDA (though most
                VCs won't sign before an initial meeting). We also verify all investor credentials.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>What happens if I get funded?</AccordionTrigger>
              <AccordionContent>
                Congratulations! We don't take any equity or success fees. Your round is 100% yours.
                We'd love a testimonial and referrals to help other founders, but there's no
                obligation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>Can I resubmit if rejected?</AccordionTrigger>
              <AccordionContent>
                Yes, after 30 days with improvements based on our feedback. Premium and Accelerated
                tiers include multiple resubmissions. We want you to succeed, so we'll guide you on
                exactly what to fix.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>What if my idea doesn't fit VC funding?</AccordionTrigger>
              <AccordionContent>
                Not every idea needs VC money. We'll tell you honestly if bootstrapping, angel
                funding, or revenue-based financing is more appropriate. Our goal is to help you
                succeed, not just sell introductions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="gradient-lavender relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-4xl font-bold text-white">Ready to Get Funded?</h2>
            <p className="mb-8 text-xl text-white/90">
              Join 200+ founders who've used Motif to connect with investors. No equity required. No
              success fees. Just high-quality introductions.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Dialog open={qualificationOpen} onOpenChange={setQualificationOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="rounded-[16px] bg-white px-8 text-lg text-primary shadow-xl hover:bg-white/90"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Check If You Qualify
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Button
                size="lg"
                variant="outline"
                className="rounded-[16px] border-white px-8 text-lg text-white hover:bg-white/10"
                onClick={() => onNavigate?.('Community')}
              >
                See Success Stories
              </Button>
            </div>

            <p className="text-muted-foreground mt-8 text-sm text-white/60">
              Questions? Email us at funding@motif.com
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

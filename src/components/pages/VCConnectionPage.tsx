import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Rocket,
  Target,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
  ArrowRight,
  DollarSign,
  MessageCircle,
  FileText,
  Upload,
  X,
  ChevronRight,
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

// Mock data for validated ideas
const MOCK_IDEAS = [
  { id: 1, title: 'AI-Powered Resume Builder', score: 85, description: 'Automated resume creation using AI', category: 'SaaS' },
  { id: 2, title: 'Sustainable Fashion Marketplace', score: 92, description: 'Platform for eco-friendly clothing', category: 'E-commerce' },
  { id: 3, title: 'Local Food Delivery Network', score: 45, description: 'Community-based food delivery', category: 'Marketplace' },
  { id: 4, title: 'EdTech Learning Platform', score: 78, description: 'Interactive online courses', category: 'Education' },
  { id: 5, title: 'Smart Home Energy Manager', score: 60, description: 'AI-based energy optimization', category: 'IoT' },
  { id: 6, title: 'Healthcare Appointment System', score: 88, description: 'Streamlined medical scheduling', category: 'Healthcare' },
];

export function VCConnectionPage({ onNavigate }: VCConnectionPageProps) {
  const [qualificationOpen, setQualificationOpen] = useState(false);
  const [qualificationForm, setQualificationForm] = useState({
    name: '',
    email: '',
    ideaDescription: '',
    stage: '',
    traction: '',
    fundingAmount: '',
  });

  // Raise Funding Modal State
  const [fundingModalOpen, setFundingModalOpen] = useState(false);
  const [fundingStep, setFundingStep] = useState(1);
  const [selectedIdea, setSelectedIdea] = useState<number | null>(null);
  const [pitchFile, setPitchFile] = useState<File | null>(null);

  // Filter ideas with score > 70%
  const validatedIdeas = MOCK_IDEAS.filter(idea => idea.score > 70);

  const handleQualificationSubmit = () => {
    // Feature not yet implemented - requires backend integration for qualification scoring
    toast.info('Qualification assessment is coming soon! For now, submit your startup through the Dashboard to connect with VCs.');
    setQualificationOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-lavender relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-3">Connect with VCs through Motif</h1>
            <p className="text-white/80 max-w-3xl mx-auto">
              Share your validated idea, upload your pitch, and let us route it to the right investors.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row mb-4 mt-6">
              <Button className="rounded-xl" onClick={() => setFundingModalOpen(true)}>
                Start a Funding Request
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => onNavigate?.('Dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Raise Funding Modal */}
      <Dialog open={fundingModalOpen} onOpenChange={(open: boolean) => {
        setFundingModalOpen(open);
        if (!open) {
          setFundingStep(1);
          setSelectedIdea(null);
          setPitchFile(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl flex items-center justify-between">
              Raise Funding
            </DialogTitle>
            <DialogDescription className="text-base">
              Choose a validated idea and upload your pitch deck.
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Select Validated Idea */}
          {fundingStep === 1 && (
            <div className="space-y-6 py-4">
              {validatedIdeas.length === 0 ? (
                <Card className="border-dashed border-2 border-muted-foreground/30">
                  <CardContent className="text-center py-10">
                    <p className="text-muted-foreground mb-3">You don’t have any validated ideas yet.</p>
                    <Button onClick={() => onNavigate?.('idea-analyser')} className="rounded-xl">
                      Run Idea Analyser
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {validatedIdeas.map((idea) => (
                    <Card
                      key={idea.id}
                      className={`cursor-pointer border ${selectedIdea?.id === idea.id ? 'border-primary' : 'border-border'}`}
                      onClick={() => setSelectedIdea(idea)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold">{idea.title}</h4>
                        <p className="text-muted-foreground text-sm line-clamp-2">{idea.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload Pitch Material */}
          {fundingStep === 2 && (
            <div className="space-y-6 py-4">
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="pitch-upload"
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPitchFile(file);
                  }}
                />
                
                <Label htmlFor="pitch-upload" className="cursor-pointer text-primary underline">
                  Click to upload your pitch deck
                </Label>
              </div>

              {pitchFile && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{pitchFile.name}</p>
                      <p className="text-muted-foreground text-sm">{Math.round(pitchFile.size / 1024)} KB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setPitchFile(null)}>
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Pitch Deck Guidelines
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Keep it to 10-12 slides focused on problem, solution, and traction.</li>
                  <li>Include key metrics, team, and fundraising ask.</li>
                  <li>Export as PDF or PPT for easier review.</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 gap-3">
            {fundingStep === 2 && (
              <Button variant="outline" onClick={() => setFundingStep(1)} className="px-6">
                Back
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setFundingModalOpen(false);
                setFundingStep(1);
                setSelectedIdea(null);
                setPitchFile(null);
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (fundingStep === 1 && selectedIdea) {
                  setFundingStep(2);
                } else if (fundingStep === 2 && pitchFile) {
                  toast.info('Funding request submission is coming soon! For now, connect with VCs directly through the VC Connection Dashboard.');
                  setFundingModalOpen(false);
                  setFundingStep(1);
                  setSelectedIdea(null);
                  setPitchFile(null);
                }
              }}
              disabled={fundingStep === 1 ? !selectedIdea : !pitchFile}
              className="gradient-lavender text-white px-8"
            >
              {fundingStep === 1 ? 'Next' : 'Submit Request'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Problem We Solve */}
      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold text-foreground">The Problem We Solve</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-base sm:text-lg">
              Getting funded shouldn't depend on who you know
            </p>
          </motion.div>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2">
            {/* For Founders */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-l-4 border-l-red-500 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                      <AlertCircle className="text-red-500 h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">Founders' Challenge</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Get guided intro requests, pitch uploads, and transparent status tracking—no cold outreach needed.
                </CardContent>
              </Card>
            </motion.div>

            {/* For VCs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-l-4 border-l-green-500 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                      <AlertCircle className="text-green-500 h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">Investors' Challenge</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Receive curated, vetted startups matched to your thesis with clear traction summaries.
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
            <Card className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">How it works</h3>
              <p className="text-muted-foreground">
                Submit your startup → Upload your deck → We route to aligned investors → Track status in real time.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 5-Pillar Framework */}
      <section className="bg-muted/30 pt-8 pb-12 md:pt-10 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold mb-3">Our 5-Pillar Review</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              We assess Problem, Solution, Team, Traction, and Fit to ensure quality intros.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {['Problem', 'Solution', 'Team', 'Traction', 'Fit'].map(pillar => (
              <Card key={pillar} className="p-4 text-center">
                <h4 className="font-semibold mb-2">{pillar}</h4>
                <p className="text-muted-foreground text-sm">Clear criteria to keep intros high-signal.</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How Founders Qualify - Workflow */}
      <section className="bg-background pt-8 pb-12 md:pt-10 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg">
              From qualification to VC introduction
            </p>
          </motion.div>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: 1,
                title: 'Build Your Profile',
                description:
                  'Complete our assessment, submit your pitch deck, and provide traction evidence',
                icon: FileText,
                bgColor: 'bg-purple-100 dark:bg-purple-900',
                iconColor: 'text-purple-600 dark:text-purple-400',
              },
              {
                step: 2,
                title: 'Expert Review',
                description:
                  'Our analysts score your startup and provide detailed feedback on investment readiness',
                icon: BarChart3,
                bgColor: 'bg-blue-100 dark:bg-blue-900',
                iconColor: 'text-blue-600 dark:text-blue-400',
              },
              {
                step: 3,
                title: 'VC Matching',
                description:
                  'We match you with 3-5 VCs aligned with your industry. You approve before intros',
                icon: Users,
                bgColor: 'bg-green-100 dark:bg-green-900',
                iconColor: 'text-green-600 dark:text-green-400',
              },
              {
                step: 4,
                title: 'Get Introduced',
                description:
                  'Double opt-in email introduction with your profile, deck, and our endorsement',
                icon: MessageCircle,
                bgColor: 'bg-orange-100 dark:bg-orange-900',
                iconColor: 'text-orange-600 dark:text-orange-400',
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary/20 hover:border-t-primary">
                  <CardContent className="p-6">
                    <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${step.bgColor} shadow-lg`}>
                      <step.icon className={`h-8 w-8 ${step.iconColor}`} />
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-bold text-primary">STEP {step.step}</span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-background pt-4 pb-12 md:pt-6 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="inline-flex p-2 rounded-full bg-primary/10">
                <Shield className="text-primary h-6 w-6" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold">Trust & Safety</h2>
            </div>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg">
              Our commitments to founders and investors
            </p>
          </motion.div>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2">
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

      {/* What You'll Get */}
      <section className="bg-muted/30 pt-8 pb-12 md:pt-10 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold">What You'll Receive</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg">
              Everything you need to successfully connect with investors
            </p>
          </motion.div>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: 'Investment Readiness Score',
                description: 'Detailed analysis across our 5-pillar framework with actionable improvement recommendations',
                color: 'text-blue-500',
              },
              {
                icon: Users,
                title: 'Curated VC Matches',
                description: 'Hand-selected investors whose thesis, stage, and industry focus align with your startup',
                color: 'text-purple-500',
              },
              {
                icon: MessageCircle,
                title: 'Warm Introduction',
                description: 'Double opt-in email intros with your full profile and our professional endorsement',
                color: 'text-green-500',
              },
              {
                icon: FileText,
                title: 'Pitch Review',
                description: 'Expert feedback on your deck structure, messaging, and fundraising materials',
                color: 'text-orange-500',
              },
              {
                icon: Target,
                title: 'Follow-up Support',
                description: 'Templates and guidance for investor communications and meeting preparation',
                color: 'text-pink-500',
              },
              {
                icon: Shield,
                title: 'Money-Back Guarantee',
                description: 'Full refund if you receive zero VC responses within 60 days of introductions',
                color: 'text-emerald-500',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <item.icon className={`h-10 w-10 ${item.color}`} />
                    </div>
                    <h3 className="mb-3 text-lg font-bold">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
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
            <p className="text-muted-foreground text-base sm:text-lg">Common questions about our VC connection service</p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full">
            <div className="grid md:grid-cols-2 gap-3 md:gap-4 items-start">
              {/* Column 1 */}
              <div className="space-y-2">
                <AccordionItem value="item-1" className="border rounded-lg px-4 border-b-border">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">What if VCs don't respond?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    Our money-back guarantee covers this. If zero VCs respond within 60 days, you get a
                    full refund. We also track each VC's response rate and prioritize those who
                    consistently engage.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4 border-b-border">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">Can I choose which VCs to be introduced to?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    Yes. We suggest 5-10 matches based on your industry and stage, but you approve the
                    final list before any introductions are sent. You're in complete control.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4 border-b-border">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">What if I'm pre-revenue?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    Pre-revenue is fine if you have strong traction signals like beta users, letters of
                    intent, or a significant waitlist. VCs invest in potential, not just current revenue.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4 border-b-border">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">Do I need a prototype?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    Not strictly required, but it significantly increases your qualification score. VCs
                    want to see execution capability. Even a simple MVP or clickable prototype shows
                    you're serious.
                  </AccordionContent>
                </AccordionItem>
              </div>

              {/* Column 2 */}
              <div className="space-y-2">
                <AccordionItem value="item-5" className="border rounded-lg px-4 border-b-border">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">How do you prevent idea theft?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    VCs are vetted investors with reputations to protect. Idea theft is exceptionally
                    rare in the VC world. If you're still concerned, you can request an NDA (though most
                    VCs won't sign before an initial meeting). We also verify all investor credentials.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4 border-b-border">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">What happens if I get funded?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    Congratulations! We don't take any equity or success fees. Your round is 100% yours.
                    We'd love a testimonial and referrals to help other founders, but there's no
                    obligation.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-4 border-b-border">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">Can I resubmit if rejected?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    Yes, after 30 days with improvements based on our feedback. Premium and Accelerated
                    tiers include multiple resubmissions. We want you to succeed, so we'll guide you on
                    exactly what to fix.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border rounded-lg px-4 border-b-border">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">What if my idea doesn't fit VC funding?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    Not every idea needs VC money. We'll tell you honestly if bootstrapping, angel
                    funding, or revenue-based financing is more appropriate. Our goal is to help you
                    succeed, not just sell introductions.
                  </AccordionContent>
                </AccordionItem>
              </div>
            </div>
          </Accordion>
        </div>
      </section>

    </div>
  );
}

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
  ArrowRight,
  DollarSign,
  Calendar,
  MessageCircle,
  FileText,
  Star,
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
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
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
    // Simulated submission
    setQualificationOpen(false);
    // Would normally navigate to qualification results
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
            <Badge className="mb-3 bg-white/20 px-4 py-1.5 text-white text-sm font-medium border border-white/30">
              VC Connection Layer
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl md:text-6xl leading-tight">
              Get Introduced to VCs
              <br className="hidden sm:block" />
              <span className="text-white/95"> Who Want to Fund Your Idea</span>
            </h1>
            <p className="mx-auto mb-3 max-w-3xl text-lg sm:text-xl text-white font-semibold leading-relaxed px-4">
              Skip the cold emails. Get warm introductions to investors who match your industry and stage.
            </p>
            <p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed px-4">
              Motif evaluates your startup using proven frameworks, then connects you with relevant venture capital investors seeking opportunities in your space.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row mb-4">
              <Dialog open={qualificationOpen} onOpenChange={setQualificationOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="rounded-xl bg-white px-8 py-5 text-base sm:text-lg font-semibold text-primary shadow-xl hover:bg-white/90 transition-all"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Check If You Qualify
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-6">
                    <DialogTitle className="text-2xl">Qualification Assessment</DialogTitle>
                    <DialogDescription className="text-base">
                      Tell us about your idea. We'll evaluate it against our 5-pillar framework and
                      let you know if you're ready for VC introductions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Your full name"
                          className="h-11"
                          value={qualificationForm.name}
                          onChange={e =>
                            setQualificationForm({ ...qualificationForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          className="h-11"
                          value={qualificationForm.email}
                          onChange={e =>
                            setQualificationForm({ ...qualificationForm, email: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idea" className="text-sm font-medium">One-Sentence Pitch *</Label>
                      <Input
                        id="idea"
                        placeholder="We help X do Y using Z technology"
                        maxLength={140}
                        className="h-11"
                        value={qualificationForm.ideaDescription}
                        onChange={e =>
                          setQualificationForm({
                            ...qualificationForm,
                            ideaDescription: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground flex justify-between">
                        <span>Keep it concise and clear</span>
                        <span>{qualificationForm.ideaDescription.length}/140</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="stage" className="text-sm font-medium">Current Stage *</Label>
                        <select
                          id="stage"
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={qualificationForm.stage}
                          onChange={e =>
                            setQualificationForm({ ...qualificationForm, stage: e.target.value })
                          }
                        >
                          <option value="">Select your current stage</option>
                          <option value="idea">Idea Only</option>
                          <option value="prototype">Prototype/MVP</option>
                          <option value="beta">Beta Users</option>
                          <option value="revenue">Generating Revenue</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="funding" className="text-sm font-medium">Funding Amount Seeking *</Label>
                        <select
                          id="funding"
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={qualificationForm.fundingAmount}
                          onChange={e =>
                            setQualificationForm({
                              ...qualificationForm,
                              fundingAmount: e.target.value,
                            })
                          }
                        >
                          <option value="">Select funding amount</option>
                          <option value="100k-500k">$100K - $500K</option>
                          <option value="500k-1m">$500K - $1M</option>
                          <option value="1m-2m">$1M - $2M</option>
                          <option value="2m+">$2M+</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="traction" className="text-sm font-medium">Traction Evidence</Label>
                      <Textarea
                        id="traction"
                        placeholder="e.g., 500 beta users, $5K MRR, 20% MoM growth, 1000+ waitlist signups"
                        rows={4}
                        className="resize-none"
                        value={qualificationForm.traction}
                        onChange={e =>
                          setQualificationForm({ ...qualificationForm, traction: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">Include any metrics, user feedback, or validation signals you have</p>
                    </div>
                  </div>
                  <DialogFooter className="pt-6 gap-3">
                    <Button variant="outline" onClick={() => setQualificationOpen(false)} className="px-6">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleQualificationSubmit}
                      className="gradient-lavender text-white px-8"
                      disabled={!qualificationForm.name || !qualificationForm.email || !qualificationForm.ideaDescription || !qualificationForm.stage || !qualificationForm.fundingAmount}
                    >
                      Submit Assessment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-2 border-white px-8 py-5 text-base sm:text-lg font-medium text-white hover:bg-white/10 hover:border-white/90 transition-all"
                onClick={() => {
                  const pricingSection = document.getElementById('pricing');
                  pricingSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View Pricing
              </Button>
            </div>

            {/* Raise Funding Request Button */}
            <div className="mt-10 flex justify-center px-4">
              <Button
                size="lg"
                onClick={() => setFundingModalOpen(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-7 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <DollarSign className="mr-3 h-6 w-6" />
                Raise Funding Request
                <ChevronRight className="ml-3 h-6 w-6" />
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
              <span>Raise Funding Request</span>
              <Badge variant="outline" className="text-sm">
                Step {fundingStep} of 2
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-base">
              {fundingStep === 1
                ? 'Select a validated idea from your Idea Analyzer (Score must be > 70%)'
                : 'Upload your pitch deck or materials'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Select Validated Idea */}
          {fundingStep === 1 && (
            <div className="space-y-6 py-4">
              {validatedIdeas.length === 0 ? (
                <Card className="border-dashed border-2 border-muted-foreground/30">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Validated Ideas Found</h3>
                    <p className="text-muted-foreground mb-6">
                      You need at least one idea with a score above 70% to proceed.
                    </p>
                    <Button onClick={() => onNavigate?.('Idea Analyser')} className="gradient-lavender">
                      <Target className="mr-2 h-4 w-4" />
                      Go to Idea Analyzer
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {validatedIdeas.map((idea) => (
                    <Card
                      key={idea.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedIdea === idea.id
                        ? 'border-primary border-2 bg-primary/5'
                        : 'border hover:border-primary/50'
                        }`}
                      onClick={() => setSelectedIdea(idea.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{idea.title}</h3>
                              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                {idea.category}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mb-3">{idea.description}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${idea.score}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-green-600 dark:text-green-400 min-w-[45px] text-right">
                                {idea.score}%
                              </span>
                            </div>
                          </div>
                          {selectedIdea === idea.id && (
                            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 ml-4" />
                          )}
                        </div>
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
                    if (e.target.files && e.target.files[0]) {
                      setPitchFile(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="pitch-upload" className="cursor-pointer">
                  <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Pitch Deck</h3>
                  <p className="text-muted-foreground mb-4">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, PPT, PPTX, DOC, DOCX (Max 10MB)
                  </p>
                </label>
              </div>

              {pitchFile && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-10 w-10 text-primary" />
                      <div>
                        <p className="font-medium">{pitchFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(pitchFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPitchFile(null)}
                    >
                      <X className="h-4 w-4" />
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
                  <li>Keep it concise (10-15 slides recommended)</li>
                  <li>Include problem, solution, market size, and traction</li>
                  <li>Highlight your team and competitive advantage</li>
                  <li>Clearly state your funding ask and use of funds</li>
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
                  // Submit the funding request
                  alert('Funding request submitted successfully!');
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
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                    <p className="text-sm leading-relaxed">
                      You've validated your idea but don't have investor connections
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                    <p className="text-sm leading-relaxed">Cold emailing VCs gets ignored (2% response rate)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                    <p className="text-sm leading-relaxed">
                      Warm introductions are gatekept by who you know, not what you've built
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                    <p className="text-sm leading-relaxed">Accelerators reject 98% of applicants</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                    <p className="text-sm leading-relaxed">You waste months networking instead of building</p>
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
              <Card className="h-full border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <AlertCircle className="text-blue-500 h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">Investors' Challenge</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <p className="text-sm leading-relaxed">500+ cold emails per week, mostly unqualified</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <p className="text-sm leading-relaxed">
                      Entrepreneurs pitch solutions to non-existent problems
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <p className="text-sm leading-relaxed">No standardized evaluation = wasted partner time</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <p className="text-sm leading-relaxed">Miss great founders outside their network</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <p className="text-sm leading-relaxed">Time-consuming manual filtering and outreach</p>
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
            <Card className="gradient-lavender border-none text-white hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-12 text-center">
                <h3 className="mb-6 text-3xl font-bold">What Motif Does</h3>
                <p className="mx-auto max-w-4xl text-xl leading-relaxed">
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
      <section className="bg-muted/30 pt-8 pb-12 md:pt-10 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold text-foreground">Our 5-Pillar Investment Readiness Framework</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-base sm:text-lg">
              Every idea is scored 0-100 across five dimensions. You need 75+ to qualify.
            </p>
          </motion.div>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-primary/20">
                  <CardContent className="p-8">
                    <div className={`mb-6 ${pillar.color}`}>
                      <pillar.icon className="h-12 w-12" />
                    </div>
                    <h3 className="mb-4 text-xl font-semibold">{pillar.title}</h3>
                    <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{pillar.description}</p>
                    <Badge variant="outline" className="font-mono text-xs">
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
            className="mt-12 text-center"
          >
            <Card className="bg-primary/5 border-primary/20 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-6">
                  <Shield className="text-primary h-10 w-10" />
                  <div className="text-left">
                    <p className="text-lg font-semibold">Minimum Qualifying Score: 350/500 (70%)</p>
                    <p className="text-muted-foreground text-sm mt-1">
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

      {/* Pricing Section */}
      <section className="bg-muted/30 py-12 md:py-16" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <Badge className="mb-3 bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium">
              Pricing Plans
            </Badge>
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold text-foreground">Pricing</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-base sm:text-lg">
              Pay only when we deliver introductions. No equity. No success fees. 60-day money-back guarantee.
            </p>
          </motion.div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {[
              {
                name: 'Standard',
                price: '₹5,499',
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
                price: '₹7,499',
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
                price: '₹10,499',
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
                  className={`relative h-full transition-all duration-300 ${plan.popular
                    ? 'gradient-lavender border-none text-white shadow-2xl lg:scale-[1.05]'
                    : 'hover:shadow-xl hover:border-primary/40 border-2'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-yellow-500 px-6 py-2 text-white font-bold text-sm shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-8 pt-8">
                    <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                    <p className={`text-sm mb-6 ${plan.popular ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-base opacity-70">one-time</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <ul className="mb-8 space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle
                            className={`mt-0.5 h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-primary'}`}
                          />
                          <span className={`text-base ${plan.popular ? 'text-white' : ''}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="lg"
                      className={`w-full rounded-xl py-6 text-base font-bold transition-all duration-200 ${plan.popular
                        ? 'bg-white text-primary hover:bg-white/95 hover:shadow-xl'
                        : 'gradient-lavender text-white hover:shadow-lg'
                        }`}
                      onClick={() => setSelectedPlan(plan.name)}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
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

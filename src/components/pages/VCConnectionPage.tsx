import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Target,
  Shield,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
  ArrowRight,
  MessageCircle,
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface VCConnectionPageProps {
  onNavigate?: (page: string) => void;
}

const QUALIFICATION_STORAGE_KEY = 'motif-qualification-requests';
const FUNDING_STORAGE_KEY = 'motif-funding-requests';

// Minimum score required for funding eligibility
const FUNDING_ELIGIBILITY_SCORE = 85;

// Startup stages for dropdown
const STARTUP_STAGES = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'mvp', label: 'MVP / Prototype' },
  { value: 'pre_revenue', label: 'Pre-Revenue (with users)' },
  { value: 'revenue_generating', label: 'Revenue Generating' },
  { value: 'growth', label: 'Growth Stage' },
  { value: 'scale', label: 'Scale / Expansion' },
];

interface UserIdea {
  id: string;
  idea_title: string;
  idea_description: string;
  score: number;
  target_market?: string;
  created_at: string;
}

export function VCConnectionPage({ onNavigate }: VCConnectionPageProps) {
  const { user } = useUser();
  const [qualificationOpen, setQualificationOpen] = useState(false);
  const [qualificationForm, setQualificationForm] = useState({
    name: '',
    email: '',
    ideaDescription: '',
    stage: '',
    traction: '',
    fundingAmount: '',
  });

  // User's analyzed ideas from Supabase
  const [userIdeas, setUserIdeas] = useState<UserIdea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [ideasLoadError, setIdeasLoadError] = useState<string | null>(null);

  // Raise Funding Modal State
  const [fundingModalOpen, setFundingModalOpen] = useState(false);
  const [fundingStep, setFundingStep] = useState(1);
  const [selectedIdea, setSelectedIdea] = useState<UserIdea | null>(null);
  const [pitchFile, setPitchFile] = useState<File | null>(null);

  // Founder Qualification Form State (Step 3)
  const [founderQualificationForm, setFounderQualificationForm] = useState({
    startupStage: '',
    // Basic fields
    companyName: '',
    websiteUrl: '',
    // Revenue Generating extended fields
    monthlyRevenue: '',
    revenueGrowthRate: '',
    customerCount: '',
    avgRevenuePerCustomer: '',
    grossMargin: '',
    burnRate: '',
    runway: '',
    teamSize: '',
    fundingRaised: '',
    fundingAsk: '',
    useOfFunds: '',
    industry: '',
    businessModel: '',
    competitiveAdvantage: '',
    keyMetrics: '',
  });

  // Load user's analyzed ideas from Supabase
  useEffect(() => {
    if (user) {
      loadUserIdeas();
    } else {
      setIsLoadingIdeas(false);
      setUserIdeas([]);
    }
  }, [user]);

  const loadUserIdeas = async () => {
    if (!user) return;

    setIsLoadingIdeas(true);
    setIdeasLoadError(null);

    try {
      const { data, error } = await supabase
        .from('idea_analyses')
        .select('id, idea_title, idea_description, score, target_market, created_at')
        .eq('user_id', user.id)
        .order('score', { ascending: false });

      if (error) {
        throw error;
      }

      setUserIdeas(data || []);
    } catch (error: any) {
      console.error('Error loading ideas:', error);
      setIdeasLoadError(error?.message || 'Failed to load your ideas');
      setUserIdeas([]);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  // Filter ideas with score >= 85 (funding eligibility threshold)
  const fundingEligibleIdeas = userIdeas.filter(idea => idea.score >= FUNDING_ELIGIBILITY_SCORE);
  // All ideas with score > 70 for general view
  const validatedIdeas = userIdeas.filter(idea => idea.score > 70);

  const handleQualificationSubmit = () => {
    const isNameValid = qualificationForm.name.trim().length > 0;
    const isEmailValid = qualificationForm.email.trim().length > 0 && qualificationForm.email.includes('@');
    const isDescriptionValid = qualificationForm.ideaDescription.trim().length >= 10;
    const isStageValid = qualificationForm.stage.trim().length > 0;

    if (!isNameValid) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!isEmailValid) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!isDescriptionValid) {
      toast.error('Please describe your idea (at least 10 characters).');
      return;
    }
    if (!isStageValid) {
      toast.error('Please select your idea stage.');
      return;
    }

    try {
      const stored = localStorage.getItem(QUALIFICATION_STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      const newEntry = {
        ...qualificationForm,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(QUALIFICATION_STORAGE_KEY, JSON.stringify([newEntry, ...existing]));
      toast.success('Qualification request submitted. We will follow up by email.');
      setQualificationForm({
        name: '',
        email: '',
        ideaDescription: '',
        stage: '',
        traction: '',
        fundingAmount: '',
      });
      setQualificationOpen(false);
    } catch (error) {
      console.error('Qualification submission failed:', error);
      toast.error('Failed to submit your request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Qualification Dialog */}
      <Dialog open={qualificationOpen} onOpenChange={setQualificationOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Founder Qualification</DialogTitle>
            <DialogDescription>
              Share a quick overview so we can score readiness and guide the best next steps.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qual-name">Full Name</Label>
                <Input
                  id="qual-name"
                  value={qualificationForm.name}
                  onChange={e => setQualificationForm({ ...qualificationForm, name: e.target.value })}
                  placeholder="Jane Founder"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qual-email">Email</Label>
                <Input
                  id="qual-email"
                  type="email"
                  value={qualificationForm.email}
                  onChange={e => setQualificationForm({ ...qualificationForm, email: e.target.value })}
                  placeholder="jane@startup.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qual-idea">Idea Description</Label>
              <Textarea
                id="qual-idea"
                value={qualificationForm.ideaDescription}
                onChange={e => setQualificationForm({ ...qualificationForm, ideaDescription: e.target.value })}
                placeholder="Describe the problem, your solution, and current traction."
                rows={4}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="qual-stage">
                  Idea Stage <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualificationForm.stage}
                  onValueChange={value => setQualificationForm({ ...qualificationForm, stage: value })}
                >
                  <SelectTrigger id="qual-stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="mvp">MVP</SelectItem>
                    <SelectItem value="early-revenue">Early Revenue</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qual-traction">Traction</Label>
                <Input
                  id="qual-traction"
                  value={qualificationForm.traction}
                  onChange={e => setQualificationForm({ ...qualificationForm, traction: e.target.value })}
                  placeholder="1k waitlist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qual-amount">Funding Ask</Label>
                <Input
                  id="qual-amount"
                  value={qualificationForm.fundingAmount}
                  onChange={e => setQualificationForm({ ...qualificationForm, fundingAmount: e.target.value })}
                  placeholder="$250k"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setQualificationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQualificationSubmit} className="gradient-lavender text-white">
              Submit Qualification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Button variant="outline" className="rounded-xl" onClick={() => setQualificationOpen(true)}>
                Start Qualification
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
          setFounderQualificationForm({
            startupStage: '',
            companyName: '',
            websiteUrl: '',
            monthlyRevenue: '',
            revenueGrowthRate: '',
            customerCount: '',
            avgRevenuePerCustomer: '',
            grossMargin: '',
            burnRate: '',
            runway: '',
            teamSize: '',
            fundingRaised: '',
            fundingAsk: '',
            useOfFunds: '',
            industry: '',
            businessModel: '',
            competitiveAdvantage: '',
            keyMetrics: '',
          });
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl flex items-center justify-between">
              Raise Funding
              <span className="text-sm font-normal text-muted-foreground">
                Step {fundingStep} of 3
              </span>
            </DialogTitle>
            <DialogDescription className="text-base">
              {fundingStep === 1 && 'Choose a validated idea to raise funding for.'}
              {fundingStep === 2 && 'Upload your pitch deck for investor review.'}
              {fundingStep === 3 && 'Tell us more about your startup to match you with the right VCs.'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Select Validated Idea */}
          {fundingStep === 1 && (
            <div className="space-y-6 py-4">
              {/* Loading State */}
              {isLoadingIdeas ? (
                <Card className="border-dashed border-2 border-muted-foreground/30">
                  <CardContent className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground">Loading your analyzed ideas...</p>
                  </CardContent>
                </Card>
              ) : ideasLoadError ? (
                /* Error State */
                <Card className="border-dashed border-2 border-red-300 bg-red-50 dark:bg-red-900/10">
                  <CardContent className="text-center py-10">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                    <p className="text-red-700 dark:text-red-400 mb-3">{ideasLoadError}</p>
                    <Button onClick={loadUserIdeas} variant="outline" className="rounded-xl">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : !user ? (
                /* Not Logged In State */
                <Card className="border-dashed border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/10">
                  <CardContent className="text-center py-10">
                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                    <p className="text-amber-700 dark:text-amber-400 mb-3">Please sign in to view your ideas</p>
                    <Button onClick={() => {
                      setFundingModalOpen(false);
                      onNavigate?.('Auth');
                    }} className="rounded-xl">
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              ) : fundingEligibleIdeas.length === 0 ? (
                /* No Eligible Ideas State - Score < 85 */
                <Card className="border-dashed border-2 border-muted-foreground/30">
                  <CardContent className="text-center py-10">
                    {validatedIdeas.length > 0 ? (
                      <>
                        <Target className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                        <p className="text-lg font-semibold mb-2">Almost There!</p>
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                          You have {validatedIdeas.length} validated idea{validatedIdeas.length > 1 ? 's' : ''}, but 
                          funding eligibility requires a score of <strong>{FUNDING_ELIGIBILITY_SCORE}+</strong>.
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4 mb-4 max-w-md mx-auto">
                          <p className="text-sm text-muted-foreground">Your highest score: <strong>{Math.max(...validatedIdeas.map(i => i.score))}%</strong></p>
                          <p className="text-xs text-muted-foreground mt-1">Improve your idea description or try a new analysis</p>
                        </div>
                        <Button onClick={() => {
                          setFundingModalOpen(false);
                          onNavigate?.('Idea Analyser');
                        }} className="rounded-xl">
                          Improve Your Ideas
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground mb-3">You don't have any validated ideas yet.</p>
                        <Button onClick={() => {
                          setFundingModalOpen(false);
                          onNavigate?.('Idea Analyser');
                        }} className="rounded-xl">
                          Analyze Your First Idea
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Funding Eligibility Notice */}
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {fundingEligibleIdeas.length} idea{fundingEligibleIdeas.length > 1 ? 's' : ''} eligible for funding
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Ideas with a score of {FUNDING_ELIGIBILITY_SCORE}+ qualify for VC introductions
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Select an eligible idea (score ≥ {FUNDING_ELIGIBILITY_SCORE})</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFundingModalOpen(false);
                        onNavigate?.('Idea Analyser');
                      }}
                      className="rounded-xl"
                    >
                      + Analyze New Idea
                    </Button>
                  </div>
                  <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2">
                    {fundingEligibleIdeas.map((idea) => (
                      <Card
                        key={idea.id}
                        className={`cursor-pointer border transition-all ${selectedIdea?.id === idea.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        onClick={() => setSelectedIdea(idea)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold">{idea.idea_title}</h4>
                              <p className="text-muted-foreground text-sm line-clamp-2">{idea.idea_description}</p>
                              {idea.target_market && (
                                <p className="text-xs text-muted-foreground mt-1">Target: {idea.target_market}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-center">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                idea.score >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                idea.score >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {idea.score}
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1">Score</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
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

          {/* Step 3: Founder Qualification Form */}
          {fundingStep === 3 && (
            <div className="space-y-6 py-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">
                      Pitch deck uploaded: {pitchFile?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Now tell us more about your startup to help VCs evaluate your opportunity
                    </p>
                  </div>
                </div>
              </div>

              {/* Startup Stage Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="startup-stage" className="text-base font-semibold">
                  What stage is your startup in? *
                </Label>
                <Select
                  value={founderQualificationForm.startupStage}
                  onValueChange={(value) => setFounderQualificationForm({ ...founderQualificationForm, startupStage: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select your startup stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {STARTUP_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Fields (always shown once stage is selected) */}
              {founderQualificationForm.startupStage && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name *</Label>
                      <Input
                        id="company-name"
                        value={founderQualificationForm.companyName}
                        onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, companyName: e.target.value })}
                        placeholder="Your company name"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website-url">Website URL</Label>
                      <Input
                        id="website-url"
                        value={founderQualificationForm.websiteUrl}
                        onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, websiteUrl: e.target.value })}
                        placeholder="https://yourcompany.com"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Select
                        value={founderQualificationForm.industry}
                        onValueChange={(value) => setFounderQualificationForm({ ...founderQualificationForm, industry: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saas">SaaS / Software</SelectItem>
                          <SelectItem value="fintech">FinTech</SelectItem>
                          <SelectItem value="healthtech">HealthTech</SelectItem>
                          <SelectItem value="edtech">EdTech</SelectItem>
                          <SelectItem value="ecommerce">E-Commerce</SelectItem>
                          <SelectItem value="marketplace">Marketplace</SelectItem>
                          <SelectItem value="ai_ml">AI / ML</SelectItem>
                          <SelectItem value="consumer">Consumer</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                          <SelectItem value="cleantech">CleanTech</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-size">Team Size *</Label>
                      <Select
                        value={founderQualificationForm.teamSize}
                        onValueChange={(value) => setFounderQualificationForm({ ...founderQualificationForm, teamSize: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Solo Founder</SelectItem>
                          <SelectItem value="2-5">2-5 people</SelectItem>
                          <SelectItem value="6-10">6-10 people</SelectItem>
                          <SelectItem value="11-25">11-25 people</SelectItem>
                          <SelectItem value="26-50">26-50 people</SelectItem>
                          <SelectItem value="50+">50+ people</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="funding-raised">Previous Funding Raised</Label>
                      <Select
                        value={founderQualificationForm.fundingRaised}
                        onValueChange={(value) => setFounderQualificationForm({ ...founderQualificationForm, fundingRaised: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select amount" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bootstrapped">Bootstrapped / None</SelectItem>
                          <SelectItem value="under_100k">Under $100K</SelectItem>
                          <SelectItem value="100k_500k">$100K - $500K</SelectItem>
                          <SelectItem value="500k_1m">$500K - $1M</SelectItem>
                          <SelectItem value="1m_5m">$1M - $5M</SelectItem>
                          <SelectItem value="5m_plus">$5M+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="funding-ask">Current Funding Ask *</Label>
                      <Input
                        id="funding-ask"
                        value={founderQualificationForm.fundingAsk}
                        onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, fundingAsk: e.target.value })}
                        placeholder="e.g., $500K"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Generating Extended Form */}
              {founderQualificationForm.startupStage === 'revenue_generating' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Revenue Generating Startup
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          VCs want to see your key metrics. Fill in as much as you can for a stronger profile.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Revenue & Financial Metrics
                  </h4>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="monthly-revenue">Monthly Revenue (MRR) *</Label>
                      <Input
                        id="monthly-revenue"
                        value={founderQualificationForm.monthlyRevenue}
                        onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, monthlyRevenue: e.target.value })}
                        placeholder="e.g., $10,000"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="revenue-growth">Revenue Growth Rate (MoM) *</Label>
                      <Input
                        id="revenue-growth"
                        value={founderQualificationForm.revenueGrowthRate}
                        onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, revenueGrowthRate: e.target.value })}
                        placeholder="e.g., 15%"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="customer-count">Number of Paying Customers *</Label>
                      <Input
                        id="customer-count"
                        value={founderQualificationForm.customerCount}
                        onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, customerCount: e.target.value })}
                        placeholder="e.g., 150"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="arpc">Avg Revenue Per Customer (ARPC)</Label>
                      <Input
                        id="arpc"
                        value={founderQualificationForm.avgRevenuePerCustomer}
                        onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, avgRevenuePerCustomer: e.target.value })}
                        placeholder="e.g., $67/month"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gross-margin">Gross Margin</Label>
                      <Input
                        id="gross-margin"
                        value={founderQualificationForm.grossMargin}
                        onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, grossMargin: e.target.value })}
                        placeholder="e.g., 70%"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="burn-rate">Monthly Burn Rate</Label>
                      <Input
                        id="burn-rate"
                        value={founderQualificationForm.burnRate}
                        onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, burnRate: e.target.value })}
                        placeholder="e.g., $25,000"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="runway">Current Runway</Label>
                      <Select
                        value={founderQualificationForm.runway}
                        onValueChange={(value) => setFounderQualificationForm({ ...founderQualificationForm, runway: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select runway" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="less_than_3">Less than 3 months</SelectItem>
                          <SelectItem value="3_6">3-6 months</SelectItem>
                          <SelectItem value="6_12">6-12 months</SelectItem>
                          <SelectItem value="12_18">12-18 months</SelectItem>
                          <SelectItem value="18_plus">18+ months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-model">Business Model *</Label>
                      <Select
                        value={founderQualificationForm.businessModel}
                        onValueChange={(value) => setFounderQualificationForm({ ...founderQualificationForm, businessModel: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select business model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subscription">Subscription (SaaS)</SelectItem>
                          <SelectItem value="transactional">Transactional / Pay-per-use</SelectItem>
                          <SelectItem value="marketplace">Marketplace (Take Rate)</SelectItem>
                          <SelectItem value="freemium">Freemium</SelectItem>
                          <SelectItem value="enterprise">Enterprise Licensing</SelectItem>
                          <SelectItem value="advertising">Advertising</SelectItem>
                          <SelectItem value="hardware">Hardware + Software</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="use-of-funds">Use of Funds *</Label>
                    <Textarea
                      id="use-of-funds"
                      value={founderQualificationForm.useOfFunds}
                      onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, useOfFunds: e.target.value })}
                      placeholder="How will you use the funding? e.g., 40% Product Development, 30% Sales & Marketing, 20% Hiring, 10% Operations"
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="competitive-advantage">Competitive Advantage</Label>
                    <Textarea
                      id="competitive-advantage"
                      value={founderQualificationForm.competitiveAdvantage}
                      onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, competitiveAdvantage: e.target.value })}
                      placeholder="What makes you different from competitors? What's your moat?"
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key-metrics">Other Key Metrics</Label>
                    <Textarea
                      id="key-metrics"
                      value={founderQualificationForm.keyMetrics}
                      onChange={(e) => setFounderQualificationForm({ ...founderQualificationForm, keyMetrics: e.target.value })}
                      placeholder="Any other metrics VCs should know? e.g., CAC, LTV, Churn Rate, NPS Score"
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-6 gap-3">
            {(fundingStep === 2 || fundingStep === 3) && (
              <Button variant="outline" onClick={() => setFundingStep(fundingStep - 1)} className="px-6">
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
                setFounderQualificationForm({
                  startupStage: '',
                  companyName: '',
                  websiteUrl: '',
                  monthlyRevenue: '',
                  revenueGrowthRate: '',
                  customerCount: '',
                  avgRevenuePerCustomer: '',
                  grossMargin: '',
                  burnRate: '',
                  runway: '',
                  teamSize: '',
                  fundingRaised: '',
                  fundingAsk: '',
                  useOfFunds: '',
                  industry: '',
                  businessModel: '',
                  competitiveAdvantage: '',
                  keyMetrics: '',
                });
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
                  setFundingStep(3);
                } else if (fundingStep === 3) {
                  // Validate required fields
                  const isBasicValid = founderQualificationForm.startupStage && 
                    founderQualificationForm.companyName && 
                    founderQualificationForm.industry && 
                    founderQualificationForm.teamSize &&
                    founderQualificationForm.fundingAsk;
                  
                  // Additional validation for revenue generating stage
                  const isRevenueValid = founderQualificationForm.startupStage !== 'revenue_generating' || 
                    (founderQualificationForm.monthlyRevenue && 
                     founderQualificationForm.revenueGrowthRate && 
                     founderQualificationForm.customerCount &&
                     founderQualificationForm.businessModel &&
                     founderQualificationForm.useOfFunds);
                  
                  if (!isBasicValid) {
                    toast.error('Please fill in all required fields');
                    return;
                  }
                  
                  if (!isRevenueValid) {
                    toast.error('Please fill in all required revenue metrics');
                    return;
                  }

                  try {
                    const stored = localStorage.getItem(FUNDING_STORAGE_KEY);
                    const existing = stored ? JSON.parse(stored) : [];
                    const newEntry = {
                      ideaId: selectedIdea?.id,
                      ideaTitle: selectedIdea?.idea_title,
                      ideaScore: selectedIdea?.score,
                      pitchFileName: pitchFile?.name,
                      pitchFileSize: pitchFile?.size,
                      founderQualification: founderQualificationForm,
                      createdAt: new Date().toISOString(),
                    };
                    localStorage.setItem(FUNDING_STORAGE_KEY, JSON.stringify([newEntry, ...existing]));
                    toast.success('Funding request submitted successfully! We will review and connect you with relevant VCs.');
                    setFundingModalOpen(false);
                    setFundingStep(1);
                    setSelectedIdea(null);
                    setPitchFile(null);
                    setFounderQualificationForm({
                      startupStage: '',
                      companyName: '',
                      websiteUrl: '',
                      monthlyRevenue: '',
                      revenueGrowthRate: '',
                      customerCount: '',
                      avgRevenuePerCustomer: '',
                      grossMargin: '',
                      burnRate: '',
                      runway: '',
                      teamSize: '',
                      fundingRaised: '',
                      fundingAsk: '',
                      useOfFunds: '',
                      industry: '',
                      businessModel: '',
                      competitiveAdvantage: '',
                      keyMetrics: '',
                    });
                  } catch (error) {
                    console.error('Funding request submission failed:', error);
                    toast.error('Failed to submit your request. Please try again.');
                  }
                }
              }}
              disabled={
                (fundingStep === 1 && !selectedIdea) || 
                (fundingStep === 2 && !pitchFile) ||
                (fundingStep === 3 && !founderQualificationForm.startupStage)
              }
              className="gradient-lavender text-white px-8"
            >
              {fundingStep === 1 ? 'Next' : fundingStep === 2 ? 'Next' : 'Submit Request'}
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

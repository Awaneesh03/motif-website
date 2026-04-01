import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
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
  Upload,
  Loader2,
  RefreshCw,
  TrendingUp,
  Clock,
} from 'lucide-react';

import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';
import { getQualification, saveQualification } from '../../lib/fundingService';
import { logActivity } from '../../lib/activityService';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
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

const formatRelativeDate = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays  = Math.floor(diffMs / 86_400_000);
  if (diffMins  < 1)  return 'just now';
  if (diffMins  < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays  === 1) return 'yesterday';
  return `${diffDays} days ago`;
};

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
  const [pitchOption, setPitchOption] = useState<'ai' | 'upload' | null>(null);

  // ── Funding Qualification Form State (Step 2 — persisted per user) ──────────
  const [fundingQualForm, setFundingQualForm] = useState({
    fullName: '',
    email: '',
    experienceLevel: '',
    linkedinUrl: '',
    previousStartups: '',
  });
  const [isLoadingQualification, setIsLoadingQualification] = useState(false);
  const [isSavingQualification, setIsSavingQualification] = useState(false);
  const [qualificationSaved, setQualificationSaved] = useState(false);
  const [qualFetchError, setQualFetchError] = useState<string | null>(null);
  const [qualUpdatedAt, setQualUpdatedAt] = useState<string | null>(null);
  const [qualErrors, setQualErrors] = useState({ fullName: '', email: '', experienceLevel: '' });

  // ── Final submit guard ────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Unmount / modal-close guard for in-flight fetches (Part 2) ───────────
  const fetchCancelledRef = useRef(false);

  // ── Scroll-to-top ref — attached to the DialogContent scrollable div ─────
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // ── Unsaved-changes tracking (Part 5) ────────────────────────────────────
  const [qualFormDirty, setQualFormDirty] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // ── Founder Qualification Form State (Step 4 — per submission) ───────────
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

  // Fetch + pre-fill qualification when the user enters Step 2
  useEffect(() => {
    if (fundingStep === 2 && fundingModalOpen && user) {
      fetchAndPrefillQualification();
    }
  }, [fundingStep, fundingModalOpen, user]);

  // Scroll the modal back to the top whenever the active step changes
  useEffect(() => {
    if (fundingModalOpen) {
      modalScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [fundingStep, fundingModalOpen]);

  // ── Keyboard handler: Enter → click the primary action button ────────────
  // Skip when: modal closed, step 5 (success), submitting, saving,
  //            or the focused element is a textarea or button (let native behaviour win).
  useEffect(() => {
    if (!fundingModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (fundingStep === 5 || isSubmitting || isSavingQualification) return;
      // Click the primary Next/Submit button (it carries the data-primary-action attr)
      const btn = document.querySelector<HTMLButtonElement>('[data-primary-action]');
      btn?.click();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fundingModalOpen, fundingStep, isSubmitting, isSavingQualification]);

  const fetchAndPrefillQualification = async () => {
    // Reset the cancel flag — this is a fresh intentional fetch
    fetchCancelledRef.current = false;
    setIsLoadingQualification(true);
    setQualFetchError(null);
    try {
      const data = await getQualification();
      // Modal may have closed while the request was in flight — bail out
      // so we don't overwrite the post-close state reset with stale data.
      if (fetchCancelledRef.current) return;
      if (data.found) {
        setFundingQualForm({
          fullName: data.fullName || '',
          email: data.email || '',
          experienceLevel: data.experienceLevel || '',
          linkedinUrl: data.linkedinUrl || '',
          previousStartups: data.previousStartups || '',
        });
        setQualUpdatedAt(data.updatedAt || null);
        setQualificationSaved(true);
      } else {
        setFundingQualForm(prev => ({ ...prev, email: user?.email || '' }));
        setQualUpdatedAt(null);
        setQualificationSaved(false);
      }
      // Mark clean — the form now matches the server state
      setQualFormDirty(false);
    } catch (err: any) {
      if (fetchCancelledRef.current) return;
      const isTimeout = err?.name === 'AbortError' || err?.message?.includes('timed out');
      setQualFetchError(
        isTimeout
          ? 'Request timed out. Check your connection and try again.'
          : 'Failed to load your profile. Check your connection and try again.'
      );
    } finally {
      if (!fetchCancelledRef.current) setIsLoadingQualification(false);
    }
  };

  // Filter ideas with score >= 85 (funding eligibility threshold)
  const fundingEligibleIdeas = userIdeas.filter(idea => idea.score >= FUNDING_ELIGIBILITY_SCORE);
  // All ideas with score > 70 for general view
  const validatedIdeas = userIdeas.filter(idea => idea.score > 70);

  const handleQualificationSubmit = async () => {
    const isNameValid = qualificationForm.name.trim().length > 0;
    const isEmailValid = qualificationForm.email.trim().length > 0 && qualificationForm.email.includes('@');
    const isStageValid = qualificationForm.stage.trim().length > 0;

    if (!isNameValid) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!isEmailValid) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!isStageValid) {
      toast.error('Please select your idea stage.');
      return;
    }

    try {
      const { error } = await supabase.from('vc_form_submissions').insert({
        user_id: user?.id || null,
        form_type: 'qualification',
        payload: { ...qualificationForm, createdAt: new Date().toISOString() },
      });
      if (error) throw error;

      toast.success('Qualification request submitted. We will follow up by email.');
      void logActivity('funding_submitted', 'Funding qualification submitted',
        { stage: qualificationForm.stage, fundingAmount: qualificationForm.fundingAmount });
      setQualificationForm({
        name: '',
        email: '',
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
        if (!open) {
          // If user is mid-edit on the qualification form and hasn't saved yet,
          // show a confirmation dialog instead of closing immediately (Part 5).
          if (fundingStep === 2 && qualFormDirty && !isSavingQualification) {
            setCloseConfirmOpen(true);
            return; // keep modal open — confirmation dialog will decide
          }
        }
        setFundingModalOpen(open);
        if (!open) {
          // Cancel any in-flight fetch so it won't clobber the reset (Part 2)
          fetchCancelledRef.current = true;
          setFundingStep(1);
          setSelectedIdea(null);
          setPitchFile(null);
          setPitchOption(null);
          setFundingQualForm({ fullName: '', email: '', experienceLevel: '', linkedinUrl: '', previousStartups: '' });
          setQualificationSaved(false);
          setQualFetchError(null);
          setQualUpdatedAt(null);
          setQualErrors({ fullName: '', email: '', experienceLevel: '' });
          setQualFormDirty(false);
          setIsSubmitting(false);
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
          {/* Scroll anchor — scrolled into view on every step change */}
          <div ref={modalScrollRef} />
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl">
              {fundingStep === 5 ? 'Request Submitted' : 'Raise Funding'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {fundingStep < 5
                ? 'Complete the steps below to submit your funding request to our VC network.'
                : 'Your funding request has been submitted successfully.'}
            </DialogDescription>
          </DialogHeader>

          {/* ── Stepper ─────────────────────────────────────────────────── */}
          {fundingStep < 5 && (
            <div className="relative flex items-start justify-between pb-6 pt-2 px-1">
              {/* Track — background (always full width) */}
              <div className="absolute top-4 left-5 right-5 h-[2px] bg-border" />
              {/* Track — filled (advances with step) */}
              <div
                className="absolute top-4 left-5 h-[2px] bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `calc(${((fundingStep - 1) / 3) * 100}% - 2.5rem)` }}
              />
              {([
                { n: 1, label: 'Select Idea' },
                { n: 2, label: 'Qualification' },
                { n: 3, label: 'Pitch Deck' },
                { n: 4, label: 'Submit' },
              ] as const).map(({ n, label }) => {
                const isComplete = fundingStep > n;
                const isActive   = fundingStep === n;
                return (
                  <div key={n} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                        isComplete
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                          ? 'bg-primary text-primary-foreground shadow-[0_0_0_4px] shadow-primary/20'
                          : 'bg-background border-2 border-border text-muted-foreground'
                      }`}
                    >
                      {isComplete ? <CheckCircle className="h-3.5 w-3.5" /> : n}
                    </div>
                    <span
                      className={`text-[10px] font-medium text-center leading-tight w-14 hidden sm:block ${
                        isActive ? 'text-foreground' : isComplete ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Animated step content ───────────────────────────────────── */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={fundingStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >

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

          {/* Step 2: Founder Qualification (persisted profile) */}
          {fundingStep === 2 && (
            <div className="space-y-6 py-4">
              {/* Loading state */}
              {isLoadingQualification ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm">Loading your profile...</p>
                </div>
              ) : qualFetchError ? (
                /* Fetch error — show retry instead of silent empty form */
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Could not load your profile</p>
                    <p className="text-sm text-muted-foreground">{qualFetchError}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchAndPrefillQualification}
                    className="rounded-xl"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try again
                  </Button>
                </div>
              ) : (
                <>
                  {/* "Saved info loaded" banner with last-updated timestamp */}
                  {qualificationSaved && (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Saved info loaded</p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Your previous qualification details have been pre-filled. Review and update as needed.
                          </p>
                          {qualUpdatedAt && (
                            <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                              <Clock className="h-3 w-3" />
                              Last updated: {formatRelativeDate(qualUpdatedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full Name + Email */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="qual-full-name">Full Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="qual-full-name"
                        value={fundingQualForm.fullName}
                        onChange={e => {
                          setFundingQualForm({ ...fundingQualForm, fullName: e.target.value });
                          setQualFormDirty(true);
                          if (qualErrors.fullName) setQualErrors(prev => ({ ...prev, fullName: '' }));
                        }}
                        placeholder="Jane Founder"
                        className={`rounded-xl ${qualErrors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {qualErrors.fullName && (
                        <p className="text-destructive text-xs">{qualErrors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="qual-email-step2">Email <span className="text-destructive">*</span></Label>
                      <Input
                        id="qual-email-step2"
                        type="email"
                        value={fundingQualForm.email}
                        onChange={e => {
                          setFundingQualForm({ ...fundingQualForm, email: e.target.value });
                          setQualFormDirty(true);
                          if (qualErrors.email) setQualErrors(prev => ({ ...prev, email: '' }));
                        }}
                        placeholder="jane@startup.com"
                        className={`rounded-xl ${qualErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {qualErrors.email && (
                        <p className="text-destructive text-xs">{qualErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div className="space-y-1">
                    <Label htmlFor="experience-level">Founder Experience <span className="text-destructive">*</span></Label>
                    <Select
                      value={fundingQualForm.experienceLevel}
                      onValueChange={value => {
                        setFundingQualForm({ ...fundingQualForm, experienceLevel: value });
                        setQualFormDirty(true);
                        if (qualErrors.experienceLevel) setQualErrors(prev => ({ ...prev, experienceLevel: '' }));
                      }}
                    >
                      <SelectTrigger
                        id="experience-level"
                        className={`h-11 rounded-xl ${qualErrors.experienceLevel ? 'border-destructive' : ''}`}
                      >
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_time">First-time founder</SelectItem>
                        <SelectItem value="1_2_startups">1–2 previous startups</SelectItem>
                        <SelectItem value="3_plus">3+ previous startups</SelectItem>
                        <SelectItem value="serial">Serial entrepreneur (exited before)</SelectItem>
                      </SelectContent>
                    </Select>
                    {qualErrors.experienceLevel && (
                      <p className="text-destructive text-xs">{qualErrors.experienceLevel}</p>
                    )}
                  </div>

                  {/* LinkedIn + Previous Startups */}
                  <div className="space-y-1">
                    <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
                    <Input
                      id="linkedin-url"
                      value={fundingQualForm.linkedinUrl}
                      onChange={e => { setFundingQualForm({ ...fundingQualForm, linkedinUrl: e.target.value }); setQualFormDirty(true); }}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="previous-startups">Previous Startup Experience</Label>
                    <Textarea
                      id="previous-startups"
                      value={fundingQualForm.previousStartups}
                      onChange={e => { setFundingQualForm({ ...fundingQualForm, previousStartups: e.target.value }); setQualFormDirty(true); }}
                      placeholder="Briefly describe any previous startups you've built, even if they didn't succeed..."
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>

                  {/* Inline saving indicator */}
                  {isSavingQualification && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving your details…
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Pitch Deck */}
          {fundingStep === 3 && (
            <div className="space-y-5 py-4">
              <p className="text-sm text-muted-foreground">
                How would you like to share your pitch with investors?
              </p>

              {/* Option cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => { setPitchOption('ai'); setPitchFile(null); }}
                  className={`relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 cursor-pointer ${
                    pitchOption === 'ai'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                      pitchOption === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">AI-generated pitch</p>
                      <p className="text-xs text-muted-foreground">From Pitch Generator</p>
                    </div>
                  </div>
                  {pitchOption === 'ai' && (
                    <CheckCircle className="absolute top-3 right-3 h-4 w-4 text-primary" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPitchOption('upload')}
                  className={`relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 cursor-pointer ${
                    pitchOption === 'upload'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                      pitchOption === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Upload className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Upload your own</p>
                      <p className="text-xs text-muted-foreground">PDF, PPT, PPTX, DOC</p>
                    </div>
                  </div>
                  {pitchOption === 'upload' && (
                    <CheckCircle className="absolute top-3 right-3 h-4 w-4 text-primary" />
                  )}
                </button>
              </div>

              {/* AI pitch confirmation */}
              {pitchOption === 'ai' && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">AI-generated pitch selected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your most recent pitch from the Pitch Generator will be shared with investors.
                    </p>
                  </div>
                </div>
              )}

              {/* File upload zone */}
              {pitchOption === 'upload' && (
                <div className="space-y-3">
                  {!pitchFile ? (
                    <label
                      htmlFor="pitch-upload"
                      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all duration-200"
                    >
                      <input
                        type="file"
                        id="pitch-upload"
                        className="hidden"
                        accept=".pdf,.ppt,.pptx,.doc,.docx"
                        onChange={(e) => setPitchFile(e.target.files?.[0] || null)}
                      />
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          Drop your file here or <span className="text-primary">browse</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, PPT, PPTX, DOC — up to 50 MB</p>
                      </div>
                    </label>
                  ) : (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{pitchFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(pitchFile.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPitchFile(null)}
                          className="flex-shrink-0"
                        >
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Guidelines — shown before a selection is made */}
              {!pitchOption && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Pitch Deck Guidelines
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Keep it to 10–12 slides focused on problem, solution, and traction.</li>
                    <li>Include key metrics, team, and fundraising ask.</li>
                    <li>Export as PDF or PPT for easier review.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Founder Qualification Form (per-submission details) */}
          {fundingStep === 4 && (
            <div className="space-y-6 py-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">
                      {pitchOption === 'ai'
                        ? 'AI-generated pitch selected'
                        : `Pitch deck uploaded: ${pitchFile?.name}`}
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

          {/* Step 5: Success screen */}
          {fundingStep === 5 && (
            <div className="flex flex-col items-center text-center py-10 gap-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <CheckCircle className="h-10 w-10 text-primary" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Funding request submitted!</h3>
                <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed text-sm">
                  We'll review your submission and connect you with the right VCs within
                  5–7 business days. Keep an eye on your inbox.
                </p>
              </div>
              <Button
                className="gradient-lavender text-white px-8 rounded-xl"
                onClick={() => {
                  fetchCancelledRef.current = true;
                  setFundingModalOpen(false);
                  setFundingStep(1);
                  setSelectedIdea(null);
                  setPitchFile(null);
                  setPitchOption(null);
                  setFundingQualForm({ fullName: '', email: '', experienceLevel: '', linkedinUrl: '', previousStartups: '' });
                  setQualificationSaved(false);
                  setQualFetchError(null);
                  setQualUpdatedAt(null);
                  setQualErrors({ fullName: '', email: '', experienceLevel: '' });
                  setQualFormDirty(false);
                  setIsSubmitting(false);
                  setFounderQualificationForm({
                    startupStage: '', companyName: '', websiteUrl: '',
                    monthlyRevenue: '', revenueGrowthRate: '', customerCount: '',
                    avgRevenuePerCustomer: '', grossMargin: '', burnRate: '',
                    runway: '', teamSize: '', fundingRaised: '', fundingAsk: '',
                    useOfFunds: '', industry: '', businessModel: '',
                    competitiveAdvantage: '', keyMetrics: '',
                  });
                  onNavigate?.('Dashboard');
                }}
              >
                Back to Dashboard
              </Button>
            </div>
          )}

            </motion.div>
          </AnimatePresence>

          {fundingStep < 5 && (
          <DialogFooter className="pt-6 gap-3">
            {fundingStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setFundingStep(fundingStep - 1)}
                disabled={isSubmitting || isSavingQualification}
                className="px-6"
              >
                Back
              </Button>
            )}
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                // Same dirty-check as onOpenChange — Cancel also warns mid-edit (Part 5)
                if (fundingStep === 2 && qualFormDirty && !isSavingQualification) {
                  setCloseConfirmOpen(true);
                  return;
                }
                fetchCancelledRef.current = true;
                setFundingModalOpen(false);
                setFundingStep(1);
                setSelectedIdea(null);
                setPitchFile(null);
                setPitchOption(null);
                setFundingQualForm({ fullName: '', email: '', experienceLevel: '', linkedinUrl: '', previousStartups: '' });
                setQualificationSaved(false);
                setQualFetchError(null);
                setQualUpdatedAt(null);
                setQualErrors({ fullName: '', email: '', experienceLevel: '' });
                setQualFormDirty(false);
                setIsSubmitting(false);
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
              onClick={async () => {
                // ── Step 1 → Step 2 ──────────────────────────────────────────
                if (fundingStep === 1) {
                  if (!selectedIdea) return;
                  setFundingStep(2);

                // ── Step 2 → Step 3 (validate + save) ───────────────────────
                } else if (fundingStep === 2) {
                  // Inline validation
                  const errors = { fullName: '', email: '', experienceLevel: '' };
                  if (!fundingQualForm.fullName.trim()) {
                    errors.fullName = 'Full name is required';
                  }
                  if (!fundingQualForm.email.trim()) {
                    errors.email = 'Email is required';
                  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fundingQualForm.email)) {
                    errors.email = 'Please enter a valid email address';
                  }
                  if (!fundingQualForm.experienceLevel) {
                    errors.experienceLevel = 'Please select your experience level';
                  }
                  if (errors.fullName || errors.email || errors.experienceLevel) {
                    setQualErrors(errors);
                    // Scroll to the first invalid field (Part 6)
                    const firstErrorId = errors.fullName
                      ? 'qual-full-name'
                      : errors.email
                      ? 'qual-email-step2'
                      : 'experience-level';
                    setTimeout(() => {
                      document
                        .getElementById(firstErrorId)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                    return;
                  }
                  setQualErrors({ fullName: '', email: '', experienceLevel: '' });

                  // Save then advance — optimistic: move immediately on success
                  setIsSavingQualification(true);
                  try {
                    await saveQualification(fundingQualForm);
                    setQualificationSaved(true);
                    setQualFormDirty(false); // form now matches server — no unsaved changes
                    setFundingStep(3);
                  } catch {
                    toast.error('Failed to save your profile. Please try again.');
                  } finally {
                    setIsSavingQualification(false);
                  }

                // ── Step 3 → Step 4 (guard: qualification must be saved) ─────
                } else if (fundingStep === 3) {
                  if (!qualificationSaved) {
                    setFundingStep(2);
                    toast.error('Please complete your qualification profile first.');
                    return;
                  }
                  if (!pitchOption || (pitchOption === 'upload' && !pitchFile)) return;
                  setFundingStep(4);

                // ── Step 4: Final submit ──────────────────────────────────────
                } else if (fundingStep === 4) {
                  // Prevent double-submit
                  if (isSubmitting) return;

                  // Defensive: ensure prior steps are complete (Part 3)
                  if (!selectedIdea) {
                    setFundingStep(1);
                    toast.error('Please select an idea first.');
                    return;
                  }
                  if (!pitchFile) {
                    setFundingStep(3);
                    toast.error('Please upload your pitch deck first.');
                    return;
                  }

                  // Validate required fields
                  const isBasicValid =
                    founderQualificationForm.startupStage &&
                    founderQualificationForm.companyName &&
                    founderQualificationForm.industry &&
                    founderQualificationForm.teamSize &&
                    founderQualificationForm.fundingAsk;

                  const isRevenueValid =
                    founderQualificationForm.startupStage !== 'revenue_generating' ||
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

                  setIsSubmitting(true);
                  try {
                    const { error } = await supabase.from('vc_form_submissions').insert({
                      user_id: user?.id || null,
                      form_type: 'funding',
                      payload: {
                        ideaId: selectedIdea?.id,
                        ideaTitle: selectedIdea?.idea_title,
                        ideaScore: selectedIdea?.score,
                        pitchType: pitchOption,
                        pitchFileName: pitchOption === 'upload' ? pitchFile?.name : 'ai-generated',
                        pitchFileSize: pitchOption === 'upload' ? pitchFile?.size : null,
                        founderQualification: founderQualificationForm,
                        founderProfile: fundingQualForm,
                        createdAt: new Date().toISOString(),
                      },
                    });
                    if (error) throw error;
                    // Show in-modal success screen
                    setFundingStep(5);
                  } catch (err) {
                    console.error('Funding request submission failed:', err);
                    toast.error('Failed to submit your request. Please try again.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }
              }}
              disabled={
                (fundingStep === 1 && !selectedIdea) ||
                (fundingStep === 2 && (
                  isSavingQualification ||
                  isLoadingQualification ||
                  !!qualFetchError
                )) ||
                (fundingStep === 3 && (!pitchOption || (pitchOption === 'upload' && !pitchFile))) ||
                (fundingStep === 4 && (!founderQualificationForm.startupStage || isSubmitting))
              }
              className="gradient-lavender text-white px-8"
              data-primary-action
            >
              {isSavingQualification ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
              ) : fundingStep < 4 ? (
                <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
              ) : (
                <>Submit Request <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Unsaved qualification changes — confirm discard */}
      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your qualification profile. If you close now, those changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCloseConfirmOpen(false)}>
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setCloseConfirmOpen(false);
                fetchCancelledRef.current = true;
                setFundingModalOpen(false);
                setFundingStep(1);
                setSelectedIdea(null);
                setPitchFile(null);
                setPitchOption(null);
                setFundingQualForm({ fullName: '', email: '', experienceLevel: '', linkedinUrl: '', previousStartups: '' });
                setQualificationSaved(false);
                setQualFetchError(null);
                setQualUpdatedAt(null);
                setQualErrors({ fullName: '', email: '', experienceLevel: '' });
                setQualFormDirty(false);
                setIsSubmitting(false);
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
            >
              Discard &amp; Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Presentation,
  Sparkles,
  Download,
  RefreshCw,
  CheckCircle,
  Lightbulb,
  Target,
  TrendingUp,
  FolderOpen,
  Loader2,
  FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';
import { startPitch, pollPitchStatus } from '../../lib/aiAnalysis';

interface SavedIdea {
  id: string;
  idea_title: string;
  idea_description: string;
  target_market: string | null;
  market_size: string | null;
  recommendations: string[] | null;
}

interface PitchCreatorPageProps {
  onNavigate?: (page: string) => void;
}

export function PitchCreatorPage({ onNavigate }: PitchCreatorPageProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    ideaName: '',
    problem: '',
    solution: '',
    audience: '',
    market: '',
    usp: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<any>(null);

  // Polling refs — keep these out of state to avoid re-render loops
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentJobIdRef = useRef<string | null>(null);
  const pollFnRef = useRef<(() => Promise<void>) | null>(null);
  const pitchStartRef = useRef<number>(0);
  // Used by the "View" toast action to reliably scroll to the slides list after modal opens
  const slideListRef = useRef<HTMLDivElement>(null);

  // localStorage keys — both scoped to user ID so different users don't share data
  const ACTIVE_PITCH_JOB_KEY = `motif-active-pitch-job-${user?.id ?? 'anon'}`;
  const PITCH_CACHE_KEY = `motif-pitch-v2-${user?.id ?? 'anon'}`;

  // Saved ideas state
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);

  // Fetch the user's saved analyses to pre-fill the form
  useEffect(() => {
    if (!user?.id) return;
    const fetchSavedIdeas = async () => {
      setIsLoadingIdeas(true);
      try {
        const { data } = await supabase
          .from('idea_analyses')
          .select('id, idea_title, idea_description, target_market, market_size, recommendations')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setSavedIdeas(data ?? []);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[PitchCreator] Failed to load saved ideas:', err);
        toast.error('Could not load your saved ideas. You can still fill in the form manually.');
      } finally {
        setIsLoadingIdeas(false);
      }
    };
    fetchSavedIdeas();
  }, [user?.id]);

  // Cancel any in-flight poll when component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // When the user switches back to this tab, immediately fire a poll.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && pollFnRef.current) {
        pollFnRef.current();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Resume any in-progress pitch job after navigation or tab switch.
  // The backend job continues independently; we just restart polling here.
  useEffect(() => {
    if (!user?.id) return;
    if (pollIntervalRef.current) return; // already polling

    const stored = localStorage.getItem(ACTIVE_PITCH_JOB_KEY);
    if (!stored) return;

    let activeJob: {
      jobId: string;
      startedAt?: number;
      formData?: typeof formData;
    } | null = null;
    try {
      activeJob = JSON.parse(stored);
    } catch {
      localStorage.removeItem(ACTIVE_PITCH_JOB_KEY);
      return;
    }

    if (!activeJob?.jobId) {
      localStorage.removeItem(ACTIVE_PITCH_JOB_KEY);
      return;
    }

    const resumedJobId = activeJob.jobId;
    const localJobKey = ACTIVE_PITCH_JOB_KEY;

    currentJobIdRef.current = resumedJobId;
    // Restore the original start time so the 5-minute wall-clock cap is not
    // reset to zero on every navigation back. Fall back to Date.now() only if
    // the stored entry pre-dates this field (backwards compat).
    pitchStartRef.current = activeJob.startedAt ?? Date.now();
    // Restore form fields so the user can see what's being generated.
    if (activeJob.formData) {
      setFormData(activeJob.formData);
    }
    setIsGenerating(true);
    toast.info('Resuming pitch generation…', { duration: 3000 });

    const resumePoll = async () => {
      try {
        const status = await pollPitchStatus(resumedJobId);

        if (status.status === 'COMPLETED' && status.result) {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          pollFnRef.current = null;
          localStorage.removeItem(localJobKey);
          const resumedSlides = status.result.slides.map(slide => ({
            ...slide,
            icon: inferIconFromTitle(slide.title),
          }));
          setGeneratedSlides({ slides: resumedSlides });
          setIsGenerating(false);
          setShowPitchModal(true);
          toast.success('Pitch deck generated!');
          try {
            localStorage.setItem(PITCH_CACHE_KEY, JSON.stringify({ slides: resumedSlides, generatedAt: Date.now() }));
          } catch { /* storage quota — non-fatal */ }
          console.info('[PitchCreator:analytics]', {
            event: 'pitch.completed',
            generationMs: Date.now() - pitchStartRef.current,
            slideCount: resumedSlides.length,
          });

        } else if (status.status === 'FAILED') {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          pollFnRef.current = null;
          localStorage.removeItem(localJobKey);
          setIsGenerating(false);
          toast.error(status.errorMessage || 'Pitch generation failed. Please try again.');

        } else {
          // PENDING / PROCESSING — enforce 5-minute wall-clock cap (immune to tab throttling)
          if (Date.now() - pitchStartRef.current > 5 * 60 * 1000) {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            pollFnRef.current = null;
            localStorage.removeItem(localJobKey);
            setIsGenerating(false);
            toast.error('Pitch generation timed out. Please try again.');
          }
        }
      } catch (pollErr) {
        const errMsg = pollErr instanceof Error ? pollErr.message : '';
        if (errMsg.toLowerCase().includes('not found') || errMsg.includes('404')) {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          pollFnRef.current = null;
          localStorage.removeItem(localJobKey);
          setIsGenerating(false);
          toast.error('Pitch session expired. Please generate again.');
          return;
        }
        console.warn('[PitchCreator] Resume poll error (will retry):', pollErr);
      }
    };

    pollFnRef.current = resumePoll;
    resumePoll();
    pollIntervalRef.current = setInterval(resumePoll, 2500);
  }, [user?.id]); // only re-run when user changes (intentional — closes over ACTIVE_PITCH_JOB_KEY derived from user.id)

  // Restore last completed pitch from cache. Skipped if there is an active background job
  // being resumed (both can't coexist meaningfully at the same time).
  useEffect(() => {
    if (!user?.id) return;
    if (localStorage.getItem(ACTIVE_PITCH_JOB_KEY)) return;

    const stored = localStorage.getItem(PITCH_CACHE_KEY);
    if (!stored) return;
    try {
      const cached = JSON.parse(stored);
      const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
      if (!cached?.slides?.length || Date.now() - (cached.generatedAt ?? 0) > TTL_MS) {
        localStorage.removeItem(PITCH_CACHE_KEY);
        return;
      }
      setGeneratedSlides({ slides: cached.slides });
      toast.info('Your last pitch is ready.', {
        action: {
          label: 'View',
          onClick: () => {
            setShowPitchModal(true);
            setTimeout(() => slideListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
          },
        },
        duration: 5000,
      });
    } catch {
      localStorage.removeItem(PITCH_CACHE_KEY);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill form when user selects a saved idea
  const handleSelectIdea = (ideaId: string) => {
    const idea = savedIdeas.find(i => i.id === ideaId);
    if (!idea) return;

    // Use the first two recommendations as a starting point for the solution field
    const recs = Array.isArray(idea.recommendations) ? idea.recommendations : [];
    const solutionHint = recs.slice(0, 2).join('. ').substring(0, 500);

    setFormData({
      ideaName: (idea.idea_title || '').substring(0, 100),
      problem: (idea.idea_description || '').substring(0, 500),
      solution: solutionHint,
      audience: (idea.target_market || '').substring(0, 100),
      market: (idea.market_size || '').substring(0, 100),
      usp: '',
    });
    toast.success(`Loaded "${idea.idea_title}" — fill in the solution field and generate your pitch.`);
  };

  const inferIconFromTitle = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('introduction') || lower.includes('startup')) return 'intro';
    if (lower.includes('problem')) return 'problem';
    if (lower.includes('solution')) return 'solution';
    if (lower.includes('market')) return 'market';
    if (lower.includes('product') || lower.includes('overview')) return 'product';
    if (lower.includes('business') || lower.includes('model') || lower.includes('revenue') || lower.includes('financials')) return 'business';
    if (lower.includes('traction') || lower.includes('roadmap')) return 'traction';
    if (lower.includes('competi')) return 'competitive';
    if (lower.includes('go-to') || lower.includes('gtm') || lower.includes('market strategy')) return 'gtm';
    if (lower.includes('team')) return 'team';
    if (lower.includes('vision') || lower.includes('closing')) return 'vision';
    return 'product';
  };

  const handleGeneratePitch = async () => {
    if (!user) {
      toast.error('Please login to generate a pitch');
      return;
    }

    // Cancel any previous poll
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    pitchStartRef.current = Date.now();
    setIsGenerating(true);

    try {
      const { jobId } = await startPitch({
        ideaName: formData.ideaName,
        problem: formData.problem,
        solution: formData.solution,
        audience: formData.audience || null,
        market: formData.market || null,
        usp: formData.usp || null,
      });

      currentJobIdRef.current = jobId;
      // Persist so polling can resume if user navigates away and comes back.
      // startedAt lets the resume path honour the original 5-minute cap instead
      // of restarting it from zero on every navigation back.
      // formData lets the UI show what is being generated during resume.
      localStorage.setItem(ACTIVE_PITCH_JOB_KEY, JSON.stringify({
        jobId,
        startedAt: pitchStartRef.current,
        formData: { ...formData },
      }));

      const doPoll = async () => {
        try {
          const status = await pollPitchStatus(currentJobIdRef.current!);

          if (status.status === 'COMPLETED' && status.result) {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            pollFnRef.current = null;
            localStorage.removeItem(ACTIVE_PITCH_JOB_KEY);

            const pitchData = {
              slides: status.result.slides.map(slide => ({
                ...slide,
                icon: inferIconFromTitle(slide.title),
              })),
            };

            setGeneratedSlides(pitchData);
            setIsGenerating(false);
            setShowPitchModal(true);
            toast.success('Pitch deck generated!');

            // Cache result for restore on next visit
            try {
              localStorage.setItem(PITCH_CACHE_KEY, JSON.stringify({ slides: pitchData.slides, generatedAt: Date.now() }));
            } catch { /* storage quota — non-fatal */ }

            console.info('[PitchCreator:analytics]', {
              event: 'pitch.completed',
              generationMs: Date.now() - pitchStartRef.current,
              slideCount: pitchData.slides.length,
            });

            // Save to Supabase (non-blocking, fire-and-forget)
            if (user?.id) {
              const saveAsync = async () => {
                try {
                  const { data: ideaData, error: ideaError } = await supabase
                    .from('idea_analyses').insert({
                      idea_title: formData.ideaName,
                      idea_description: formData.problem,
                      target_market: formData.market || null,
                      user_id: user.id,
                      score: 0,
                      strengths: [],
                      weaknesses: [],
                      recommendations: [],
                      market_size: formData.market || null,
                      competition: null,
                      viability: null,
                    }).select().single();
                  if (!ideaError && ideaData) {
                    await supabase.from('pitches').insert({
                      user_id: user.id,
                      idea_id: ideaData.id,
                      title: formData.ideaName,
                    });
                  }
                } catch { /* non-fatal */ }
              };
              saveAsync();
            }

          } else if (status.status === 'FAILED') {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            pollFnRef.current = null;
            localStorage.removeItem(ACTIVE_PITCH_JOB_KEY);
            setIsGenerating(false);
            toast.error(status.errorMessage || 'Pitch generation failed. Please try again.');
            console.warn('[PitchCreator:analytics]', {
              event: 'pitch.failed',
              generationMs: Date.now() - pitchStartRef.current,
              error: status.errorMessage,
            });

          } else {
            // PENDING / PROCESSING — enforce 5-minute wall-clock cap (immune to tab throttling)
            if (Date.now() - pitchStartRef.current > 5 * 60 * 1000) {
              clearInterval(pollIntervalRef.current!);
              pollIntervalRef.current = null;
              pollFnRef.current = null;
              localStorage.removeItem(ACTIVE_PITCH_JOB_KEY);
              setIsGenerating(false);
              toast.error('Pitch generation is taking too long. Please try again.');
            }
          }
        } catch (pollErr) {
          console.warn('[PitchCreator] Poll error (will retry):', pollErr);
        }
      };

      pollFnRef.current = doPoll;
      doPoll();
      pollIntervalRef.current = setInterval(doPoll, 2500);

    } catch (error) {
      localStorage.removeItem(ACTIVE_PITCH_JOB_KEY);
      setIsGenerating(false);
      const msg = error instanceof Error ? error.message : 'Failed to start pitch generation.';
      if (msg.includes('timed out') || msg.includes('Failed to fetch')) {
        toast.error('The server is starting up — please wait 30 seconds and try again.');
      } else {
        toast.error(msg);
      }
    }
  };

  // Validation
  const isIdeaNameValid = formData.ideaName.trim().length >= 3;
  const isProblemValid = formData.problem.trim().length >= 20;
  const isSolutionValid = formData.solution.trim().length >= 20;
  const isFormValid = isIdeaNameValid && isProblemValid && isSolutionValid;

  const slideIcons: Record<string, any> = {
    intro: Presentation,
    problem: Target,
    solution: Lightbulb,
    market: TrendingUp,
    product: Sparkles,
    business: Presentation,
    traction: TrendingUp,
    competitive: Target,
    gtm: TrendingUp,
    financials: TrendingUp,
    team: CheckCircle,
    vision: Sparkles,
  };

  // --- PDF Download ---
  const handleDownloadPDF = () => {
    if (!generatedSlides) {
      toast.error('No pitch deck to download');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   // 297 mm
    const pageH = doc.internal.pageSize.getHeight();  // 210 mm
    const margin = 22;

    // ── Cover page ──────────────────────────────────────────────────
    doc.setFillColor(201, 167, 235);         // lavender #C9A7EB
    doc.rect(0, 0, pageW, pageH, 'F');

    doc.setFillColor(150, 90, 210);          // darker accent strip at bottom
    doc.rect(0, pageH - 18, pageW, 18, 'F');

    // Idea name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(34);
    const titleLines = doc.splitTextToSize(formData.ideaName, pageW - margin * 2);
    doc.text(titleLines, pageW / 2, pageH / 2 - 14, { align: 'center' });

    // Subtitle
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('AI-Generated Pitch Deck', pageW / 2, pageH / 2 + (titleLines.length - 1) * 12 + 6, { align: 'center' });

    // Footer
    doc.setFontSize(9);
    doc.text(
      `Generated by Motif  ·  ${new Date().toLocaleDateString()}`,
      pageW / 2,
      pageH - 7,
      { align: 'center' }
    );

    // ── Slide pages ─────────────────────────────────────────────────
    const FOOTER_H = 12;
    const SAFE_BOTTOM = pageH - FOOTER_H - 6;
    const TEXT_W = pageW - margin * 2 - 12;
    const LINE_H = 7;            // mm per wrapped line of bullet text
    const LINE_GAP = 5;          // mm between bullets
    const MAX_LINES_PER_PAGE = 9; // hard cap on rendered text lines per page

    generatedSlides.slides.forEach((slide: any, index: number) => {
      const points: string[] = slide.points ?? [];
      let nextIdx = 0;          // index of next bullet to render
      let isContinuation = false;

      // Each loop iteration = one PDF page for this slide.
      // Normal case: all bullets fit, loop runs once.
      // Overflow case: remaining bullets spill to a continuation page.
      do {
        doc.addPage();

        // Header bar
        doc.setFillColor(201, 167, 235);
        doc.rect(0, 0, pageW, 18, 'F');

        // Slide counter (top-right, inside header)
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(
          `${index + 1} / ${generatedSlides.slides.length}`,
          pageW - margin, 12, { align: 'right' }
        );

        // Slide title — append "(cont.)" on overflow continuation pages
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 20, 60);
        doc.text(isContinuation ? `${slide.title} (cont.)` : slide.title, margin, 36);

        // Divider
        doc.setDrawColor(201, 167, 235);
        doc.setLineWidth(0.5);
        doc.line(margin, 42, pageW - margin, 42);

        // Bullet points
        let y = 56;
        let linesOnPage = 0;      // running count of rendered text lines on this page
        const pageStart = nextIdx; // first bullet index on this page

        for (let pi = nextIdx; pi < points.length; pi++) {
          const bLines: string[] = doc.splitTextToSize(points[pi], TEXT_W);
          const blockH = bLines.length * LINE_H + LINE_GAP;
          const wouldOverflow =
            y + blockH > SAFE_BOTTOM ||
            linesOnPage + bLines.length > MAX_LINES_PER_PAGE;

          if (wouldOverflow) {
            // Overflow: if this is the very first bullet on a fresh page, force-render it
            // to prevent an infinite loop. Shouldn't occur with 12-word bullets in practice.
            if (pi === pageStart) {
              doc.setFillColor(150, 90, 210);
              doc.circle(margin + 3, y - 2.5, 1.6, 'F');
              doc.setTextColor(55, 35, 85);
              doc.setFontSize(12);
              doc.setFont('helvetica', 'normal');
              doc.text(bLines, margin + 10, y);
              nextIdx = pi + 1;
            }
            break; // remaining bullets spill to the next page
          }

          doc.setFillColor(150, 90, 210);
          doc.circle(margin + 3, y - 2.5, 1.6, 'F');
          doc.setTextColor(55, 35, 85);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(bLines, margin + 10, y);
          y += blockH;
          linesOnPage += bLines.length;
          nextIdx = pi + 1;
        }

        // Footer strip
        doc.setFillColor(240, 230, 250);
        doc.rect(0, pageH - FOOTER_H, pageW, FOOTER_H, 'F');
        doc.setFontSize(8);
        doc.setTextColor(130, 100, 180);
        doc.text('Motif — Your AI-Powered Startup Companion', pageW / 2, pageH - 4, { align: 'center' });

        isContinuation = true;
      } while (nextIdx < points.length);
    });

    const filename = `${formData.ideaName.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}_Pitch_Deck.pdf`;
    doc.save(filename);
    toast.success('PDF downloaded!');
  };

  const handleRegeneratePitch = async () => {
    if (!isFormValid) {
      toast.error('Please fill in all required fields');
      return;
    }
    await handleGeneratePitch();
  };

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#C9A7EB]/15 via-background to-background py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left"
          >
            <div className="gradient-lavender flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lavender">
              <Presentation className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-gradient-lavender text-xl sm:text-2xl">Create Your Startup Pitch</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Turn your idea into a professional pitch deck in minutes
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary h-5 w-5" />
                    Pitch Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* ── Load from Saved Idea ── */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
                      <Label className="text-sm font-medium">Load from a Saved Analysis (Optional)</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select one of your previously analyzed ideas to auto-fill the form below.
                    </p>
                    {isLoadingIdeas ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading your ideas...
                      </div>
                    ) : savedIdeas.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-1">
                        No saved analyses found.{' '}
                        <button
                          type="button"
                          onClick={() => onNavigate?.('Idea Analyser')}
                          className="text-primary underline underline-offset-2"
                        >
                          Analyze an idea first
                        </button>
                      </p>
                    ) : (
                      <Select onValueChange={handleSelectIdea}>
                        <SelectTrigger className="rounded-lg bg-background">
                          <SelectValue placeholder="Select a saved idea…" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedIdeas.map(idea => (
                            <SelectItem key={idea.id} value={idea.id}>
                              {idea.idea_title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Idea Name */}
                  <div className="space-y-2">
                    <Label htmlFor="ideaName">Idea Name *</Label>
                    <Input
                      id="ideaName"
                      placeholder="e.g., AI-powered Fitness Coach"
                      value={formData.ideaName}
                      onChange={e => setFormData({ ...formData, ideaName: e.target.value })}
                      className="h-12 rounded-xl"
                      maxLength={100}
                    />
                    <p className="text-muted-foreground text-xs">
                      {isIdeaNameValid ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span>Minimum 3 characters ({formData.ideaName.length}/100)</span>
                      )}
                    </p>
                  </div>

                  {/* Problem */}
                  <div className="space-y-2">
                    <Label htmlFor="problem">Problem Statement *</Label>
                    <Textarea
                      id="problem"
                      placeholder="What problem does your idea solve?"
                      value={formData.problem}
                      onChange={e => setFormData({ ...formData, problem: e.target.value })}
                      className="min-h-[100px] resize-none rounded-xl"
                      maxLength={500}
                    />
                    <p className="text-muted-foreground text-xs">
                      {isProblemValid ? (
                        <span className="text-green-600">✓ {formData.problem.length}/500 characters</span>
                      ) : (
                        <span>Minimum 20 characters ({formData.problem.length}/500)</span>
                      )}
                    </p>
                  </div>

                  {/* Solution */}
                  <div className="space-y-2">
                    <Label htmlFor="solution">Your Solution *</Label>
                    <Textarea
                      id="solution"
                      placeholder="How does your idea solve this problem?"
                      value={formData.solution}
                      onChange={e => setFormData({ ...formData, solution: e.target.value })}
                      className="min-h-[100px] resize-none rounded-xl"
                      maxLength={500}
                    />
                    <p className="text-muted-foreground text-xs">
                      {isSolutionValid ? (
                        <span className="text-green-600">✓ {formData.solution.length}/500 characters</span>
                      ) : (
                        <span>Minimum 20 characters ({formData.solution.length}/500)</span>
                      )}
                    </p>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      placeholder="e.g., Busy professionals aged 25-40"
                      value={formData.audience}
                      onChange={e => setFormData({ ...formData, audience: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  {/* Market Size */}
                  <div className="space-y-2">
                    <Label htmlFor="market">Market Opportunity</Label>
                    <Input
                      id="market"
                      placeholder="e.g., $10B fitness tech market"
                      value={formData.market}
                      onChange={e => setFormData({ ...formData, market: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  {/* USP */}
                  <div className="space-y-2">
                    <Label htmlFor="usp">Unique Selling Proposition</Label>
                    <Textarea
                      id="usp"
                      placeholder="What makes your solution unique?"
                      value={formData.usp}
                      onChange={e => setFormData({ ...formData, usp: e.target.value })}
                      className="min-h-[80px] resize-none rounded-xl"
                    />
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGeneratePitch}
                    disabled={!isFormValid || isGenerating}
                    className="gradient-lavender shadow-lavender h-12 w-full rounded-xl hover:opacity-90"
                  >
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                        />
                        Generating investor-ready pitch…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Pitch
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tips & Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Card className="glass-surface border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3 text-sm">
                  <div className="flex gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>Keep your problem statement clear and concise</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>Focus on the unique value you bring</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>Use data to support your market claims</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-surface border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground text-sm text-left">
                      AI generates a 12-slide investor-ready deck. Download as a styled PDF ready to share.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Learning Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <Card className="glass-surface border-border/50">
              <CardHeader>
                <CardTitle>Learn What Makes a Great Pitch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  <div className="flex gap-3">
                    <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="mb-1">Problem First</h4>
                      <p className="text-muted-foreground text-sm">
                        Start with a clear problem that resonates with your audience
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="mb-1">Simple Solution</h4>
                      <p className="text-muted-foreground text-sm">
                        Explain your solution in terms anyone can understand
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="gradient-lavender flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="mb-1">Show Traction</h4>
                      <p className="text-muted-foreground text-sm">
                        Include metrics and validation to build credibility
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 text-center">
                  <Button variant="outline" className="rounded-xl" onClick={() => onNavigate?.('Resources')}>
                    View Full Pitch Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Pitch Output Modal */}
      <Dialog open={showPitchModal} onOpenChange={setShowPitchModal}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Your AI-Generated Pitch</DialogTitle>
            <DialogDescription>
              Review your pitch deck slides. Download as PDF or regenerate as needed.
            </DialogDescription>
          </DialogHeader>
          {generatedSlides && (
            <div ref={slideListRef} className="space-y-4 py-4">
              {/* Slides Preview */}
              {generatedSlides.slides.map((slide: any, index: number) => {
                const IconComponent = slideIcons[slide.icon] ?? Sparkles;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
                  >
                    <Card className="glass-surface border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="gradient-lavender flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2 text-xs">
                              Slide {index + 1} of {generatedSlides.slides.length}
                            </Badge>
                            <h4 className="mb-2 text-sm font-semibold">{slide.title}</h4>
                            {slide.points?.length > 0 && (
                              <ul className="space-y-1.5">
                                {slide.points.map((point: string, i: number) => (
                                  <li key={i} className="text-muted-foreground text-sm flex gap-2">
                                    <span className="text-primary flex-shrink-0 font-medium">·</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowPitchModal(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleRegeneratePitch}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                      />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
                <Button
                  className="gradient-lavender shadow-lavender flex-1 rounded-xl hover:opacity-90"
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

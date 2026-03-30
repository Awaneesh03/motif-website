import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import {
  Sparkles,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Zap,
  FileText,
  Download,
  FolderOpen,
  Upload,
  X,
  File,
  RefreshCw,
  Shield,
  BarChart3,
  TrendingDown,
  HelpCircle,
} from 'lucide-react';

import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';

// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { startAnalysis, pollAnalysisStatusSafe, generateIdea, improveDescription } from '../../lib/aiAnalysis';
import type { SafeAnalysisResult, GeneratedIdea } from '../../lib/aiAnalysis';
import { fromLegacyResult } from '../../lib/analysisValidator';
import type { Competitor } from '../../lib/analysisValidator';

interface CommunityIdea {
  title: string;
  description: string;
  upvotes: number;
  comments: number;
  tags: string[];
  author: string;
  authorAvatar?: string;
  createdAt: string;
}

interface IdeaAnalyserPageProps {
  onNavigate?: (page: string) => void;
}

// ── Competition UI component ──────────────────────────────────────────────────

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4">
      <p className="text-sm font-semibold leading-snug text-foreground">{competitor.name}</p>
      {competitor.threat && (
        <div className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600">Threat</span>
            <p className="text-xs leading-relaxed text-muted-foreground">{competitor.threat}</p>
          </div>
        </div>
      )}
      {competitor.opportunity && (
        <div className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600">Opportunity</span>
            <p className="text-xs leading-relaxed text-muted-foreground">{competitor.opportunity}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Maximum characters shown in the description textarea before truncation. */
const PREVIEW_CHAR_LIMIT = 400;

/**
 * Truncates text to at most `limit` characters, breaking at the last word
 * boundary to avoid cutting mid-word. Appends "…" when truncation occurs.
 * The full original text is never modified — this is display-only.
 */
function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > limit * 0.8 ? lastSpace : limit;
  return text.slice(0, cut) + '…';
}

export function IdeaAnalyserPage({ onNavigate }: IdeaAnalyserPageProps) {
  const { user, profile, displayName } = useUser();
  
  // Storage key is user-specific — prevents one user seeing another user's data
  const FORM_STORAGE_KEY = `motif-idea-analyser-form-${user?.id ?? 'anon'}`;
  // localStorage key for active job — survives navigation and tab switches (unlike sessionStorage)
  const ACTIVE_JOB_KEY = `motif-active-analysis-job-${user?.id ?? 'anon'}`;

  // Clear old non-user-scoped localStorage/sessionStorage keys (one-time migration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('motif-idea-analyser-form');
      sessionStorage.removeItem('motif-idea-analyser-form');
    }
  }, []);
  
  // Load saved form data from sessionStorage (only persists within same tab)
  const getSavedFormData = () => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  
  const savedData = getSavedFormData();
  
  const [ideaTitle, setIdeaTitle] = useState(savedData?.ideaTitle || '');
  const [ideaDescription, setIdeaDescription] = useState(savedData?.ideaDescription || '');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(savedData?.selectedMarkets || []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SafeAnalysisResult | null>(() => {
    // Hydrate from sessionStorage — handle both new and legacy format
    const saved = savedData?.analysisResult;
    if (!saved) return null;
    if (saved.idea_summary) return saved as SafeAnalysisResult; // already new format
    if (saved.score !== undefined) return fromLegacyResult(saved);   // legacy → new
    return null;
  });
  const [showDemoReportModal, setShowDemoReportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);

  // Animated analysis step state (drives the stages checklist)
  const [analysisStep, setAnalysisStep] = useState(0);
  const analysisTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisStartRef = useRef<number>(0);
  // Polling refs for job-based async analysis
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentJobIdRef = useRef<string | null>(null);
  // Auto-retry tracking — reset on each new analysis, max 1 silent retry
  const autoRetryCountRef = useRef<number>(0);
  // Ref to current poll function — used by visibilitychange listener to fire immediately on tab focus
  const pollFnRef = useRef<(() => Promise<void>) | null>(null);
  // Track user ID to detect account switches in the same tab
  const prevUserIdRef = useRef(user?.id);
  // Controls whether extracted PDF text is shown in full or as a preview
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Persist form data to sessionStorage whenever it changes (cleared on new tab)
  useEffect(() => {
    const formData = {
      ideaTitle,
      ideaDescription,
      selectedMarkets,
      analysisResult,
    };
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [ideaTitle, ideaDescription, selectedMarkets, analysisResult]);

  // Reset all state when the logged-in user changes (e.g. logout → new login in same tab)
  useEffect(() => {
    if (prevUserIdRef.current === user?.id) return;
    prevUserIdRef.current = user?.id;

    setIdeaTitle('');
    setIdeaDescription('');
    setSelectedMarkets([]);
    setAnalysisResult(null);
    setUploadedFile(null);
    setIsAnalyzing(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [user?.id]);

  // Drive staged progress while the API call is in-flight.
  // Stages:  0–20% | 20–40% | 40–60% | 60–80% | 80–95%
  // Each stage fills with quadratic ease-out over its allotted duration.
  // Stage 4 fills slowly (30 s budget) and waits for the API.
  // Progress jumps to 100% only when the API responds (see handleAnalyze).
  useEffect(() => {
    if (!isAnalyzing) {
      // Clear timer but keep progress value — the exit animation (300 ms)
      // should still show whatever progress was reached, not snap to 0.
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
      return;
    }

    // New analysis starting — reset to first stage
    setAnalysisStep(0);
    analysisStartRef.current = Date.now();

    // How long each stage label is shown before advancing (ms)
    const STAGE_DURATIONS = [3000, 5000, 6000, 6000]; // stages 0–3

    analysisTimerRef.current = setInterval(() => {
      const totalElapsed = Date.now() - analysisStartRef.current;

      let stage = STAGE_DURATIONS.length; // 4 = last open-ended stage
      let cumulative = 0;

      for (let i = 0; i < STAGE_DURATIONS.length; i++) {
        if (totalElapsed < cumulative + STAGE_DURATIONS[i]) {
          stage = i;
          break;
        }
        cumulative += STAGE_DURATIONS[i];
      }

      setAnalysisStep(stage);
    }, 1000); // 1 s tick — only need to update the stage label

    return () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
    };
  }, [isAnalyzing]);  

  // Cancel any in-flight poll when the component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // When the user switches back to this tab, immediately fire a poll so the
  // result appears without waiting up to 2.5 s for the next interval tick.
  // Also resets the start time so throttled/catch-up ticks don't cause false timeouts.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && pollFnRef.current) {
        pollFnRef.current();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Resume any in-progress analysis after navigation or tab switch.
  // The backend job continues independently; we just restart polling here.
  useEffect(() => {
    if (!user?.id) return;
    if (pollIntervalRef.current) return; // already polling

    const stored = localStorage.getItem(ACTIVE_JOB_KEY);
    if (!stored) return;

    let activeJob: { jobId: string; ideaTitle?: string; ideaDescription?: string } | null = null;
    try {
      activeJob = JSON.parse(stored);
    } catch {
      localStorage.removeItem(ACTIVE_JOB_KEY);
      return;
    }

    if (!activeJob?.jobId) {
      localStorage.removeItem(ACTIVE_JOB_KEY);
      return;
    }

    const resumedJobId = activeJob.jobId;
    const localJobKey = ACTIVE_JOB_KEY; // capture for closure

    // Restore form fields if empty (e.g. user opened a new tab while analysis was running)
    if (activeJob.ideaTitle && !ideaTitle) setIdeaTitle(activeJob.ideaTitle);
    if (activeJob.ideaDescription && !ideaDescription) setIdeaDescription(activeJob.ideaDescription);

    currentJobIdRef.current = resumedJobId;
    autoRetryCountRef.current = 0;
    analysisStartRef.current = Date.now();
    setIsAnalyzing(true);

    const resumePoll = async () => {
      try {
        const status = await pollAnalysisStatusSafe(resumedJobId);

        if (status.status === 'COMPLETED' && status.safeResult) {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          pollFnRef.current = null;
          localStorage.removeItem(localJobKey);
          setAnalysisResult(status.safeResult);
          setIsAnalyzing(false);
          toast.success('Analysis complete!');

        } else if (status.status === 'FAILED') {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          pollFnRef.current = null;
          localStorage.removeItem(localJobKey);
          setIsAnalyzing(false);
          toast.error(status.errorMessage || 'Analysis failed. Please try again.');

        } else {
          // PENDING / PROCESSING — enforce 5-minute wall-clock cap (immune to tab throttling)
          if (Date.now() - analysisStartRef.current > 5 * 60 * 1000) {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            pollFnRef.current = null;
            localStorage.removeItem(localJobKey);
            setIsAnalyzing(false);
            toast.error('Analysis timed out. Please try again.');
          }
        }
      } catch (pollErr) {
        const errMsg = pollErr instanceof Error ? pollErr.message : '';
        // Job expired / cleaned up on the server — stop polling immediately
        if (errMsg.toLowerCase().includes('not found') || errMsg.includes('404')) {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          pollFnRef.current = null;
          localStorage.removeItem(localJobKey);
          setIsAnalyzing(false);
          toast.error('Analysis session expired. Please start a new analysis.');
          return;
        }
        console.warn('[IdeaAnalyser] Resume poll error (will retry):', pollErr);
      }
    };

    pollFnRef.current = resumePoll;
    resumePoll();
    pollIntervalRef.current = setInterval(resumePoll, 2500);
  }, [user?.id]);  

  // Scroll the loading card into view once it mounts
  useEffect(() => {
    if (!isAnalyzing) return;
    const timer = setTimeout(() => {
      document.getElementById('analysis-loading-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
    return () => clearTimeout(timer);
  }, [isAnalyzing]);

  // Predefined target market options
  const MARKET_OPTIONS = [
    'B2B',
    'B2C',
    'SaaS',
    'Students',
    'Enterprises',
    'Creators',
    'SMBs',
    'Developers',
    'Healthcare',
    'E-commerce',
  ];

  const ANALYSIS_STAGES = [
    { label: 'Reading your idea', detail: 'Parsing title, description and market context', Icon: FileText },
    { label: 'Evaluating market opportunity', detail: 'Sizing TAM / SAM and growth trajectory', Icon: TrendingUp },
    { label: 'Scanning competition', detail: 'Mapping the competitive landscape and positioning gaps', Icon: Users },
    { label: 'Scoring execution & risk', detail: 'Weighing feasibility against known risk factors', Icon: Zap },
    { label: 'Generating VC-grade insights', detail: 'Compiling strengths, weaknesses and recommendations', Icon: Sparkles },
  ] as const;

  const COMMUNITY_STORAGE_KEY = 'motif-community-ideas';

  const normalizeIdeaValue = (value: string) =>
    value.trim().replace(/\s+/g, ' ').toLowerCase();

  const buildTagsFromTargetMarket = (markets: string[]) => {
    return markets.length > 0 ? markets.slice(0, 3) : ['General'];
  };

  const toggleMarket = (market: string) => {
    setSelectedMarkets(prev =>
      prev.includes(market)
        ? prev.filter(m => m !== market)
        : prev.length < 3 ? [...prev, market] : prev
    );
  };

  // Sanitize extracted text to remove characters that cause PostgreSQL errors
  const sanitizeExtractedText = (text: string): string => {
    return text
      .replace(/\0/g, '') // Remove null bytes — PostgreSQL rejects these in TEXT columns
      // eslint-disable-next-line no-control-regex
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars (keep \t \n \r)
      .trim();
  };

  // File upload handlers
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  };

  const handleFileSelect = async (file: File) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or text file');
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);

    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await file.text();
      }

      if (!extractedText || extractedText.length < 50) {
        toast.error('Could not extract enough text from the file. Please try a different file or enter details manually.');
        setUploadedFile(null);
        return;
      }

      // Sanitize to remove null bytes and control chars that cause PostgreSQL save failures
      const sanitized = sanitizeExtractedText(extractedText);

      // Truncate if too long (backend accepts up to 10000 chars)
      const truncatedText = sanitized.length > 10000
        ? sanitized.substring(0, 10000)
        : sanitized;

      // Try to extract a title from the first line or use filename
      const lines = sanitized.split('\n').filter(l => l.trim());
      const potentialTitle = lines[0]?.substring(0, 100) || file.name.replace(/\.[^/.]+$/, '');
      
      setIdeaTitle(potentialTitle.length > 5 ? potentialTitle : file.name.replace(/\.[^/.]+$/, ''));
      setIdeaDescription(truncatedText);
      
      toast.success('Document content extracted! Review and click "Analyze" to get insights.');
    } catch (error) {
      console.error('Error extracting text:', error);
      toast.error('Failed to extract text from file. Please try again.');
      setUploadedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setIdeaTitle('');
    setIdeaDescription('');
    setIsDescriptionExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearForm = () => {
    setIdeaTitle('');
    setIdeaDescription('');
    setSelectedMarkets([]);
    setAnalysisResult(null);
    setUploadedFile(null);
    setIsDescriptionExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    sessionStorage.removeItem(FORM_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_JOB_KEY);
    toast.success('Form cleared');
  };

  const saveCommunityIdea = (idea: CommunityIdea) => {
    if (typeof window === 'undefined') return false;

    try {
      const stored = localStorage.getItem(COMMUNITY_STORAGE_KEY);
      const existing: CommunityIdea[] = stored ? JSON.parse(stored) : [];
      const normalizedTitle = normalizeIdeaValue(idea.title);
      const normalizedDescription = normalizeIdeaValue(idea.description);

      const duplicate = existing.some(
        existingIdea =>
          normalizeIdeaValue(existingIdea.title) === normalizedTitle &&
          normalizeIdeaValue(existingIdea.description) === normalizedDescription
      );

      if (duplicate) return false;

      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify([idea, ...existing]));
      return true;
    } catch (error) {
      console.error('Failed to save community idea:', error);
      return false;
    }
  };

  // Validation checks
  const isTitleValid = ideaTitle.trim().length >= 5;
  const isDescriptionValid = ideaDescription.trim().length >= 20;
  const isFormValid = isTitleValid && isDescriptionValid;

  const handleAnalyze = async (forceReanalyze: boolean = false) => {

    if (!isFormValid) {
      toast.error('Please fill in all required fields with minimum lengths');
      return;
    }
    if (!user) {
      toast.error('Please login to analyze your idea');
      return;
    }

    // Cancel any previous poll that is still running
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Reset per-analysis counters
    autoRetryCountRef.current = 0;
    analysisStartRef.current = Date.now();

    setIsAnalyzing(true);

    try {
      const normalizedTitle = normalizeIdeaValue(ideaTitle);
      const normalizedDescription = normalizeIdeaValue(ideaDescription);
      const normalizedMarket = selectedMarkets.join(', ').trim().replace(/\s+/g, ' ').toLowerCase();

      if (!forceReanalyze) {
        // ── Supabase cache check ──────────────────────────────────────────────
        const { data: existingAnalyses, error: existingError } = await supabase
          .from('idea_analyses')
          .select('id, idea_title, idea_description, target_market, score, strengths, weaknesses, recommendations, market_size, competition, viability')
          .eq('user_id', user.id);

        if (!existingError && existingAnalyses && existingAnalyses.length > 0) {
          const match = existingAnalyses.find(a =>
            normalizeIdeaValue(a.idea_title) === normalizedTitle &&
            normalizeIdeaValue(a.idea_description) === normalizedDescription &&
            normalizeIdeaValue(a.target_market || '') === normalizedMarket
          );
          if (match) {
            // Convert cached Supabase row (legacy shape) to SafeAnalysisResult
            const legacyCached = {
              score: match.score ?? 0,
              strengths: Array.isArray(match.strengths) ? match.strengths : [],
              weaknesses: Array.isArray(match.weaknesses) ? match.weaknesses : [],
              recommendations: Array.isArray(match.recommendations) ? match.recommendations : [],
              marketSize: match.market_size || '',
              competition: match.competition || '',
              viability: match.viability || '',
            };
            setAnalysisResult(fromLegacyResult(legacyCached));
            setIsAnalyzing(false);
            toast.success('Loaded your saved analysis from the vault.');
            return;
          }
        }
      } else {
        // ── Force re-analyze: delete cached rows for this idea ────────────────
        const { data: existingAnalyses } = await supabase
          .from('idea_analyses').select('id, idea_title').eq('user_id', user.id);
        if (existingAnalyses) {
          const matchingIds = existingAnalyses
            .filter(a => normalizeIdeaValue(a.idea_title) === normalizedTitle)
            .map(a => a.id);
          if (matchingIds.length > 0) {
            await supabase.from('idea_analyses').delete().in('id', matchingIds);
          }
        }
      }

      // ── Start async job — returns immediately with a jobId ────────────────
      const { jobId } = await startAnalysis({
        title: ideaTitle,
        description: ideaDescription,
        targetMarket: selectedMarkets.length > 0 ? selectedMarkets.join(', ') : null,
      });
      currentJobIdRef.current = jobId;
      // Persist so polling can resume if user navigates away and comes back
      localStorage.setItem(ACTIVE_JOB_KEY, JSON.stringify({
        jobId,
        ideaTitle,
        ideaDescription,
      }));

      // ── Poll every 2.5 s — survives tab switches ──────────────────────────
      const doPoll = async () => {
        try {
          const status = await pollAnalysisStatusSafe(currentJobIdRef.current!);

          if (status.status === 'COMPLETED' && status.safeResult) {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            pollFnRef.current = null;
            localStorage.removeItem(ACTIVE_JOB_KEY);

            const safeData = status.safeResult;
            setAnalysisResult(safeData);

            // Log any hallucination flags for observability
            if (safeData._flags.length > 0) {
              console.warn('[IdeaAnalyser] Validator flagged fields:', safeData._flags);
            }

            // Frontend fallback save (backend also saves; this catches cold-start DB failures)
            if (status.legacyResult) {
              try {
                const truncatedTitle = ideaTitle.substring(0, 100);
                const normalizedTitle = truncatedTitle.trim().toLowerCase().replace(/\s+/g, ' ');
                // Check by normalized_idea (backend rows) OR exact title (legacy rows)
                const { data: existing } = await supabase
                  .from('idea_analyses').select('id')
                  .eq('user_id', user.id)
                  .or(`normalized_idea.eq.${normalizedTitle},idea_title.eq.${truncatedTitle}`)
                  .limit(1);

                if (!existing || existing.length === 0) {
                  // Cast to any: IdeaAnalysisResult only declares legacy fields, but
                  // pollAnalysisStatus enriches the object with structured fields at runtime.
                  const ld = status.legacyResult as any;
                  // Build structured JSON fields from new-format result
                  const competitionJson = (ld.competitors || ld.competitiveAdvantage)
                    ? JSON.stringify({ competitors: ld.competitors ?? [], competitiveAdvantage: ld.competitiveAdvantage ?? '' })
                    : (ld.competition ?? null);
                  const marketSizeJson = ld.market
                    ? JSON.stringify(ld.market)
                    : (ld.marketSize ?? null);

                  await supabase.from('idea_analyses').insert({
                    user_id: user.id,
                    idea_title: truncatedTitle,
                    normalized_idea: normalizedTitle,
                    idea_description: ideaDescription.substring(0, 10000),
                    target_market: selectedMarkets.length > 0 ? selectedMarkets.join(', ') : null,
                    score: ld.score,
                    strengths: ld.strengths,
                    weaknesses: ld.weaknesses,
                    recommendations: ld.recommendations,
                    market_size: marketSizeJson,
                    competition: competitionJson,
                    viability: ld.viability,
                    idea_summary: ld.ideaSummary ?? null,
                    confidence_score: ld.confidenceScore ?? null,
                    competitive_advantage: ld.competitiveAdvantage ?? null,
                    heuristic_scores: ld.heuristicScores ?? null,
                    investor_analysis: ld.investorAnalysis ?? null,
                  });
                }
              } catch (saveErr) {
                console.warn('[IdeaAnalyser] Frontend save failed (non-fatal):', saveErr);
              }
            }

            setIsAnalyzing(false);
            toast.success('Analysis complete!');

          } else if (status.status === 'FAILED') {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;

            const msg = status.errorMessage || '';
            const isRateLimit = msg.includes('Rate limit') || msg.includes('rate_limit') || msg.includes('429');
            const isAuth = msg.includes('authentication') || msg.includes('401') || msg.includes('API key');

            // Auto-retry once for transient failures (not rate-limit or auth errors)
            if (!isRateLimit && !isAuth && autoRetryCountRef.current < 1) {
              autoRetryCountRef.current += 1;
              analysisStartRef.current = Date.now();
              toast.info('Analysis hit a snag — retrying automatically…');
              try {
                const retry = await startAnalysis({
                  title: ideaTitle,
                  description: ideaDescription,
                  targetMarket: selectedMarkets.length > 0 ? selectedMarkets.join(', ') : null,
                });
                currentJobIdRef.current = retry.jobId;
                // Update localStorage with the new jobId for the retry
                localStorage.setItem(ACTIVE_JOB_KEY, JSON.stringify({ jobId: retry.jobId, ideaTitle, ideaDescription }));
                doPoll();
                pollIntervalRef.current = setInterval(doPoll, 2500);
              } catch {
                localStorage.removeItem(ACTIVE_JOB_KEY);
                setIsAnalyzing(false);
                toast.error('Analysis failed. Please try again.');
              }
              return;
            }

            pollFnRef.current = null;
            localStorage.removeItem(ACTIVE_JOB_KEY);
            setIsAnalyzing(false);
            if (isRateLimit) {
              toast.error('Rate limit exceeded. Please try again in a few moments.');
            } else if (msg.toLowerCase().includes('parse') || msg.toLowerCase().includes('format')) {
              toast.error('AI returned an unexpected response. Please try again — this is usually a one-time glitch.');
            } else if (msg.toLowerCase().includes('too long') || msg.toLowerCase().includes('timed out')) {
              toast.error('Analysis is taking longer than usual. Please try again — the AI is under load.');
            } else {
              toast.error(msg || 'Analysis failed. Please try again.');
            }
          } else {
            // PENDING / PROCESSING — enforce 5-minute wall-clock cap (immune to tab throttling)
            if (Date.now() - analysisStartRef.current > 5 * 60 * 1000) {
              clearInterval(pollIntervalRef.current!);
              pollIntervalRef.current = null;
              pollFnRef.current = null;
              localStorage.removeItem(ACTIVE_JOB_KEY);
              setIsAnalyzing(false);
              toast.error('Analysis is taking too long. Please try again — the AI may be under heavy load.');
              return;
            }
          }
          // PENDING / PROCESSING → keep polling (handled in else above)
        } catch (pollErr) {
          // Transient network error — log and retry on next tick
          console.warn('[IdeaAnalyser] Poll error (will retry):', pollErr);
        }
      };

      // Fire immediately then repeat every 2.5 s
      pollFnRef.current = doPoll;
      doPoll();
      pollIntervalRef.current = setInterval(doPoll, 2500);

    } catch (error) {
      // Error starting the job itself (auth, validation, network)
      setIsAnalyzing(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start analysis. Please try again.';
      if (errorMessage.includes('Rate limit') || errorMessage.includes('rate_limit')) {
        toast.error('Rate limit exceeded. Please try again in a few moments.');
      } else if (errorMessage.includes('API key')) {
        toast.error('AI service is not configured. Please contact support.');
      } else if (errorMessage.includes('timed out') || errorMessage.includes('Failed to fetch')) {
        toast.error('The server is starting up — please wait 30 seconds and try again.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleImproveDescription = async () => {
    if (!ideaDescription.trim()) {
      toast.error('Please enter a description first');
      return;
    }

    setIsImprovingDescription(true);
    try {
      const improvedDescription = await improveDescription(ideaDescription);
      setIdeaDescription(improvedDescription);
      toast.success('Description improved with AI!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to improve description';

      if (errorMessage.includes('Rate limit') || errorMessage.includes('rate_limit')) {
        toast.error('Rate limit exceeded. Please try again in a few moments.');
      } else if (errorMessage.includes('API key')) {
        toast.error('AI service is not configured. Please contact support.');
      } else {
        toast.error('Failed to improve description. Please try again.');
      }
    } finally {
      setIsImprovingDescription(false);
    }
  };

  const handleGenerateIdea = async () => {
    setIsGenerating(true);

    // Show a helpful message if the server takes more than 10s (Render cold-start)
    const coldStartToastId = setTimeout(() => {
      toast.info('Server is waking up — this can take up to 60 seconds on the first request…');
    }, 10000);

    const applyIdea = (generatedIdea: GeneratedIdea) => {
      clearTimeout(coldStartToastId);
      setIdeaTitle(generatedIdea.title);
      setIdeaDescription(generatedIdea.description);
      const generatedMarkets = generatedIdea.targetMarket?.split(/[,&]/).map((m: string) => m.trim()) || [];
      const matchedMarkets = MARKET_OPTIONS.filter(opt =>
        generatedMarkets.some((gm: string) => gm.toLowerCase().includes(opt.toLowerCase()))
      ).slice(0, 3);
      setSelectedMarkets(matchedMarkets.length > 0 ? matchedMarkets : ['B2C']);
      toast.success('New idea generated! Click "Analyze" to see its potential.');
    };

    try {
      // First attempt — 120s covers Render cold-start (≤90s) + OpenAI latency (≤20s)
      applyIdea(await generateIdea(120000));
    } catch (err) {
      console.error('[IdeaAnalyser] Generate idea attempt 1 failed:', err);
      const msg = err instanceof Error ? err.message : '';
      const isTimeout = msg.includes('timed out') || msg.includes('AbortError');
      const isNetwork = msg.includes('Failed to fetch') || msg.includes('unavailable');

      if (isTimeout || isNetwork) {
        // Server was cold — retry now that it's warm (60s is plenty for a warm server)
        try {
          applyIdea(await generateIdea(60000));
          return; // success — finally will clean up
        } catch (retryErr) {
          console.error('[IdeaAnalyser] Generate idea attempt 2 failed:', retryErr);
          clearTimeout(coldStartToastId);
          toast.error('Server is taking too long to respond. Please wait 30 seconds and try again.');
        }
      } else if (msg.includes('Rate limit') || msg.includes('429')) {
        clearTimeout(coldStartToastId);
        toast.error('Rate limit reached — please wait a moment and try again.');
      } else if (msg.includes('Authentication') || msg.includes('401') || msg.includes('login')) {
        clearTimeout(coldStartToastId);
        toast.error('Session expired — please log out and log back in.');
      } else {
        clearTimeout(coldStartToastId);
        toast.error('Failed to generate idea. Please try again in a moment.');
      }
    } finally {
      clearTimeout(coldStartToastId);
      setIsGenerating(false);
    }
  };

  // Download analysis report as PDF/Text
  const handleDownloadReport = (isDemoReport: boolean = false) => {
    const reportData = isDemoReport ? {
      title: 'AI-Powered Personal Finance Assistant',
      idea_summary: 'An AI-powered mobile app targeting millennials and Gen Z users who want to improve their financial literacy and achieve savings goals.',
      market_size_category: 'Large' as const,
      market_reasoning: 'The personal finance and budgeting app market is well-established with proven consumer demand.',
      growth_potential: 'Strong tailwinds from increased financial awareness among younger demographics and smartphone penetration.',
      tam: '~$15B',
      sam: '~$3B',
      som: '~$150M',
      competitors: [
        { name: 'Mint', threat: 'Brand recognition and Intuit ecosystem lock-in', opportunity: 'Mint lacks AI-driven behavioural nudges' },
        { name: 'YNAB', threat: 'Loyal subscriber base with zero-based budgeting methodology', opportunity: 'YNAB requires manual entry — no automation' },
      ],
      competitive_advantage: 'AI personalization and behavioral finance insights differentiate from rule-based incumbents.',
      strengths: [
        'Strong market demand with proven business model',
        'AI personalization differentiates from existing solutions',
        'Mobile-first approach aligns with user behavior trends'
      ],
      risks: [
        'Competitive market with established players',
        'User acquisition costs may be high in fintech space',
        'Requires bank API integrations which can be complex'
      ],
      overall_assessment: 'High viability based on validated market demand, proven business models in the space, and a clear differentiator through AI personalization.',
      recommendations: [
        'Focus on one specific user persona initially (e.g., freelancers with irregular income)',
        'Partner with banks for secure API access to simplify onboarding'
      ],
      confidence_score: 72,
    } : {
      title: ideaTitle,
      idea_summary: analysisResult?.idea_summary || '',
      market_size_category: analysisResult?.market_analysis.market_size_category || 'Medium',
      market_reasoning: analysisResult?.market_analysis.market_reasoning || '',
      growth_potential: analysisResult?.market_analysis.growth_potential || '',
      tam: analysisResult?.market_analysis.tam || '',
      sam: analysisResult?.market_analysis.sam || '',
      som: analysisResult?.market_analysis.som || '',
      competitors: analysisResult?.competition_analysis.competitors || [],
      competitive_advantage: analysisResult?.competition_analysis.competitive_advantage || '',
      strengths: analysisResult?.viability_analysis.strengths || [],
      risks: analysisResult?.viability_analysis.risks || [],
      overall_assessment: analysisResult?.viability_analysis.overall_assessment || '',
      recommendations: analysisResult?.recommendations || [],
      confidence_score: analysisResult?.confidence_score ?? 50,
    };

    // Create text content for download
    const reportContent = `
STARTUP IDEA ANALYSIS REPORT
Generated by Motif AI
========================================

IDEA: ${reportData.title}

SUMMARY
${reportData.idea_summary}

CONFIDENCE: ${(reportData as any).confidence_score ?? 50}/100

========================================
MARKET ANALYSIS
========================================
Market Size Category: ${reportData.market_size_category}
${reportData.market_reasoning}${reportData.tam ? `\n\nTAM: ${reportData.tam}` : ''}${reportData.sam ? `\nSAM: ${reportData.sam}` : ''}${reportData.som ? `\nSOM: ${reportData.som}` : ''}

Growth Potential:
${reportData.growth_potential}

========================================
COMPETITION ANALYSIS
========================================
${((reportData as any).competitors || []).length > 0
  ? ((reportData as any).competitors as any[]).map((c) => `${c.name}:\n  Threat: ${c.threat || 'N/A'}\n  Opportunity: ${c.opportunity || 'N/A'}`).join('\n\n')
  : 'No competitors identified.'}

Competitive Advantage:
${reportData.competitive_advantage}

========================================
STRENGTHS
========================================
${reportData.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

========================================
RISKS
========================================
${reportData.risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

========================================
OVERALL ASSESSMENT
========================================
${reportData.overall_assessment}

========================================
AI RECOMMENDATIONS
========================================
${reportData.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

========================================
IMPORTANT NOTICE: This analysis is AI-generated. Specific market figures
should be independently verified. The AI explicitly avoids fabricating
exact numbers — any estimates are based on general industry patterns.
========================================

Report generated on: ${new Date().toLocaleDateString()}

Powered by Motif - Your AI-Powered Startup Companion
    `.trim();

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.title.replace(/[^a-z0-9]/gi, '_')}_Analysis_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Report downloaded successfully!');
  };

  // Save/Download report
  const handleSaveReport = () => {
    if (!analysisResult) {
      toast.error('No analysis to save');
      return;
    }

    // Download the report as a file
    handleDownloadReport(false);
  };

  const handleShareToCommunity = () => {
    if (!user) {
      toast.error('Please login to share your idea');
      return;
    }

    if (!analysisResult) {
      toast.error('Analyze your idea before sharing');
      return;
    }

    if (!isFormValid) {
      toast.error('Please fill in all required fields before sharing');
      return;
    }

    const authorName = profile?.name?.trim() || displayName?.trim() || 'Founder';
    const newIdea: CommunityIdea = {
      title: ideaTitle.trim(),
      description: ideaDescription.trim(),
      tags: buildTagsFromTargetMarket(selectedMarkets),
      upvotes: 0,
      comments: 0,
      author: authorName,
      authorAvatar: profile?.avatar || undefined,
      createdAt: new Date().toISOString(),
    };

    const saved = saveCommunityIdea(newIdea);
    if (saved) {
      toast.success('Shared to the community!');
    } else {
      toast.info('This idea is already shared in the community.');
    }
  };



  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-[#C9A7EB]/15 via-background to-background py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="gradient-lavender mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-gradient-lavender mb-2 text-2xl md:text-3xl font-bold">AI Idea Analyser</h1>
            <p className="text-muted-foreground mx-auto max-w-xl text-sm md:text-base">
              Get instant AI-powered feedback on your startup idea. Analyze market potential,
              competition, and viability in seconds.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Input Form - Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-8"
            >
              <Card className="glass-card border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="text-primary h-4 w-4" />
                      Tell Us About Your Idea
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {(ideaTitle || ideaDescription || analysisResult) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearForm}
                          className="rounded-lg text-muted-foreground hover:text-destructive w-fit h-8 px-3"
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          Clear
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate?.('saved-ideas')}
                        className="rounded-lg text-muted-foreground hover:text-foreground w-fit h-8 px-3"
                      >
                        <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                        Saved Ideas
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-2">
                  {/* Idea Generator Banner */}
                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 p-4 border border-primary/10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Stuck for ideas?</h4>
                          <p className="text-xs text-muted-foreground">Let AI spark your imagination</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleGenerateIdea}
                        disabled={isGenerating}
                        variant="secondary"
                        size="sm"
                        className="w-full sm:w-auto bg-background/80 hover:bg-background shadow-sm"
                      >
                        {isGenerating ? (
                          <>
                            <Zap className="mr-2 h-3.5 w-3.5 animate-pulse text-primary" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                            Generate Random Idea
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* File Upload Zone */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Pitch Deck or Document (Optional)
                    </Label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => !uploadedFile && fileInputRef.current?.click()}
                      className={`
                        relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                        transition-all duration-200
                        ${isDragging 
                          ? 'border-primary bg-primary/5' 
                          : uploadedFile 
                            ? 'border-green-500/50 bg-green-500/5' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }
                        ${isExtracting ? 'pointer-events-none opacity-70' : ''}
                      `}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      
                      {isExtracting ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <p className="text-sm text-muted-foreground">Extracting content...</p>
                        </div>
                      ) : uploadedFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                              <File className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">{uploadedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(uploadedFile.size / 1024).toFixed(1)} KB - Content extracted
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeUploadedFile();
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Drop your file here or click to browse</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Supports PDF and TXT files (max 10MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {uploadedFile && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Content extracted! Review below and click "Analyze My Idea" to get insights.
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
                    </div>
                  </div>

                  {/* Idea Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ideaTitle" className="text-sm font-medium">Idea Title *</Label>
                    <Input
                      id="ideaTitle"
                      placeholder="e.g., AI-powered fitness coach for busy professionals"
                      value={ideaTitle}
                      onChange={e => setIdeaTitle(e.target.value)}
                      className="h-11 rounded-lg"
                      maxLength={100}
                    />
                    <p className="text-muted-foreground text-xs">
                      {ideaTitle.length >= 5 ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span>Minimum 5 characters ({ideaTitle.length}/100)</span>
                      )}
                    </p>
                  </div>

                  {/* Idea Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ideaDescription" className="text-sm font-medium">Detailed Description *</Label>
                    {(() => {
                      // shouldTruncate is true only when: a file was uploaded,
                      // the extracted text exceeds the preview limit, and the
                      // user has not yet clicked "Show More".
                      // The full text is ALWAYS stored in `ideaDescription` and
                      // sent to the backend unchanged.
                      const shouldTruncate =
                        !!uploadedFile &&
                        !isDescriptionExpanded &&
                        ideaDescription.length > PREVIEW_CHAR_LIMIT;

                      return (
                        <>
                          <Textarea
                            id="ideaDescription"
                            placeholder="Example: A platform that helps students manage study schedules with AI reminders."
                            value={shouldTruncate ? truncateText(ideaDescription, PREVIEW_CHAR_LIMIT) : ideaDescription}
                            onChange={e => { if (!shouldTruncate) setIdeaDescription(e.target.value); }}
                            readOnly={shouldTruncate}
                            className={`min-h-[140px] resize-none rounded-lg ${shouldTruncate ? 'cursor-default select-text text-muted-foreground' : ''}`}
                            maxLength={10000}
                          />

                          {/* Show More / Show Less — only when a file is uploaded and text is long */}
                          {uploadedFile && ideaDescription.length > PREVIEW_CHAR_LIMIT && (
                            <button
                              type="button"
                              onClick={() => setIsDescriptionExpanded(prev => !prev)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              {isDescriptionExpanded
                                ? 'Show Less'
                                : `Show More (${ideaDescription.length.toLocaleString()} characters total)`}
                            </button>
                          )}
                        </>
                      );
                    })()}
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-xs">
                        {ideaDescription.length >= 20 ? (
                          <span className="text-green-600">✓ {ideaDescription.length}/10000 characters</span>
                        ) : (
                          <span>Minimum 20 characters ({ideaDescription.length}/10000)</span>
                        )}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleImproveDescription}
                        disabled={!ideaDescription.trim() || isImprovingDescription}
                        className="text-primary hover:text-primary h-auto px-2 py-1"
                      >
                        {isImprovingDescription ? (
                          <>
                            <Zap className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                            <span className="text-xs">Improving...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            <span className="text-xs">Improve with AI</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Target Market */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Target Market (Optional - select up to 3)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {MARKET_OPTIONS.map((market) => (
                        <button
                          key={market}
                          type="button"
                          onClick={() => toggleMarket(market)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            selectedMarkets.includes(market)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          {market}
                        </button>
                      ))}
                    </div>
                    {selectedMarkets.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedMarkets.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Analyze Button */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => handleAnalyze(false)}
                      disabled={!isFormValid || isAnalyzing}
                      className="gradient-lavender shadow-lavender h-11 flex-1 rounded-lg hover:opacity-90"
                    >
                      {isAnalyzing ? (
                        <>
                          <Zap className="mr-2 h-4 w-4 animate-pulse" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze My Idea
                        </>
                      )}
                    </Button>
                    {analysisResult && (
                      <Button
                        onClick={() => handleAnalyze(true)}
                        disabled={!isFormValid || isAnalyzing}
                        variant="outline"
                        className="h-11 rounded-lg border-primary/30 hover:bg-primary/10"
                        title="Get a fresh analysis with updated AI"
                      >
                        <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>

                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats - Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 space-y-4"
            >
              <div className="rounded-lg bg-gradient-to-br from-[#C9A7EB]/8 to-[#B084E8]/8 p-4 border border-primary/10">
                <div className="flex items-start gap-3">
                  <div className="gradient-lavender flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Our AI analyzes market data, competition, and trends to give you actionable insights.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Animated Analysis Loading State ─────────────────────── */}
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                id="analysis-loading-card"
                key="analyzing-state"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-8"
              >
                <Card className="glass-card border-primary/20 overflow-hidden">
                  {/* Sliding shimmer bar at the top */}
                  <div className="relative h-0.5 w-full overflow-hidden bg-primary/10">
                    <motion.div
                      className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-primary/70 to-transparent"
                      animate={{ x: ['-100%', '350%'] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>

                  <CardContent className="p-6 sm:p-8">
                    {/* Header row */}
                    <div className="mb-6 flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="gradient-lavender flex h-11 w-11 items-center justify-center rounded-xl shadow-lavender">
                          <motion.div
                            animate={{ rotate: [0, 14, -14, 0] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <Sparkles className="h-5 w-5 text-white" />
                          </motion.div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">AI is analysing your idea</p>
                        <p className="text-muted-foreground text-xs truncate">"{ideaTitle}"</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          Step {Math.min(analysisStep + 1, ANALYSIS_STAGES.length)} / {ANALYSIS_STAGES.length}
                        </p>
                      </div>
                    </div>

                    {/* Stages checklist */}
                    <div className="space-y-1">
                      {ANALYSIS_STAGES.map((stage, i) => {
                        const isActive = i === analysisStep;
                        const isDone = i < analysisStep;
                        const StageIcon = stage.Icon;

                        return (
                          <motion.div
                            key={i}
                            animate={{ opacity: isDone ? 0.45 : isActive ? 1 : 0.28 }}
                            transition={{ duration: 0.4 }}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-300 ${
                              isActive ? 'bg-primary/5 border border-primary/15' : ''
                            }`}
                          >
                            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                              isDone
                                ? 'bg-green-500/10 text-green-600'
                                : isActive
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground/50'
                            }`}>
                              {isDone ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : isActive ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                                >
                                  <StageIcon className="h-3.5 w-3.5" />
                                </motion.div>
                              ) : (
                                <StageIcon className="h-3.5 w-3.5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${
                                isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                              }`}>
                                {stage.label}
                              </p>
                              <AnimatePresence>
                                {isActive && (
                                  <motion.p
                                    key={`detail-${i}`}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="overflow-hidden text-xs text-muted-foreground"
                                  >
                                    {stage.detail}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            {isActive && (
                              <div className="flex flex-shrink-0 items-center gap-0.5">
                                {[0, 1, 2].map(n => (
                                  <motion.span
                                    key={n}
                                    className="block h-1.5 w-1.5 rounded-full bg-primary"
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: n * 0.25 }}
                                  />
                                ))}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    <p className="mt-5 text-center text-xs text-muted-foreground">
                      Our VC scoring model evaluates 6 dimensions · typically 20–45 s
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Results */}
          {analysisResult && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-8"
            >
              {/* ── Analysis Summary ──────────────────────────────────── */}
              <div className="space-y-6">
                {/* Section heading */}
                <h2 className="flex items-center gap-2.5 text-2xl font-semibold">
                  <span className="gradient-lavender flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                    <Shield className="h-4 w-4 text-white" />
                  </span>
                  Analysis Summary
                </h2>

                {/* Score hero + summary row */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* Viability Score — primary dominant element */}
                  <div className={`flex-shrink-0 flex flex-col items-center justify-center rounded-2xl border px-8 py-7 text-center min-w-[164px] ${
                    (analysisResult.score ?? 0) >= 70
                      ? 'border-green-200 bg-green-50/50 dark:border-green-800/40 dark:bg-green-950/20'
                      : (analysisResult.score ?? 0) >= 50
                      ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20'
                      : 'border-red-200 bg-red-50/50 dark:border-red-800/40 dark:bg-red-950/20'
                  }`}>
                    <span className={`text-[56px] font-bold leading-none tabular-nums ${
                      (analysisResult.score ?? 0) >= 70
                        ? 'text-green-600'
                        : (analysisResult.score ?? 0) >= 50
                        ? 'text-amber-600'
                        : 'text-red-500'
                    }`}>
                      {analysisResult.score ?? 0}
                    </span>
                    <span className="text-sm text-muted-foreground/70 leading-none mt-1">/100</span>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mt-3">
                      Viability Score
                    </p>
                    {analysisResult._flags.length > 0 && (
                      <p className="mt-2 flex items-center gap-1 text-[10px] text-amber-600">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        Some figures estimated
                      </p>
                    )}
                  </div>

                  {/* Summary text + quick stat chips */}
                  <div className="flex-1 space-y-4 pt-1">
                    {analysisResult.idea_summary && (
                      <p className="text-sm leading-relaxed text-foreground/90 max-w-2xl">
                        {analysisResult.idea_summary}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.market_analysis?.tam && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          TAM: <span className="ml-0.5 font-medium text-foreground">{analysisResult.market_analysis.tam.split(' ')[0]}</span>
                        </span>
                      )}
                      {analysisResult.competition_analysis?.competitors?.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span className="font-medium text-foreground">{analysisResult.competition_analysis.competitors.length}</span>&nbsp;competitors mapped
                        </span>
                      )}
                      {analysisResult.heuristic_scores && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                          <BarChart3 className="h-3 w-3" />
                          Score breakdown below
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Breakdown */}
              {analysisResult.heuristic_scores && (
                <Card className="glass-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                      <BarChart3 className="text-primary h-5 w-5" />
                      Scoring Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {(
                      [
                        { key: 'problem',       label: 'Problem Severity' },
                        { key: 'market',        label: 'Market Opportunity' },
                        { key: 'defensibility', label: 'Defensibility' },
                        { key: 'monetization',  label: 'Monetization' },
                        { key: 'execution',     label: 'Execution Feasibility' },
                      ] as const
                    ).map(({ key, label }) => {
                      const raw = analysisResult.heuristic_scores![key];
                      const val = typeof raw === 'number' ? raw : 0;
                      const pct = Math.round((val / 20) * 100);
                      const color =
                        pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-yellow-500' : 'bg-red-500';
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-40 flex-shrink-0 text-xs text-muted-foreground">{label}</span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${color} transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 flex-shrink-0 text-right text-xs font-medium tabular-nums">
                            {val}/20
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Market Analysis Deep Dive */}
              <Card className="glass-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4 border-b border-border/40">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    <BarChart3 className="text-primary h-5 w-5" />
                    Market Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* TAM / SAM / SOM row — shown only when structured data is available */}
                  {(analysisResult.market_analysis.tam || analysisResult.market_analysis.sam || analysisResult.market_analysis.som) && (
                    <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/20 p-3">
                      {analysisResult.market_analysis.tam && (
                        <div className="text-center">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">TAM</div>
                          <div className="text-sm font-semibold">{analysisResult.market_analysis.tam.split(' ')[0]}</div>
                          <div className="text-[10px] text-muted-foreground">Total Market</div>
                        </div>
                      )}
                      {analysisResult.market_analysis.sam && (
                        <div className="text-center">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">SAM</div>
                          <div className="text-sm font-semibold">{analysisResult.market_analysis.sam.split(' ')[0]}</div>
                          <div className="text-[10px] text-muted-foreground">Serviceable</div>
                        </div>
                      )}
                      {analysisResult.market_analysis.som && (
                        <div className="text-center">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">SOM</div>
                          <div className="text-sm font-semibold">{analysisResult.market_analysis.som.split(' ')[0]}</div>
                          <div className="text-[10px] text-muted-foreground">Obtainable</div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="max-w-3xl">
                    <h4 className="text-sm font-medium mb-1">Market Reasoning</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{analysisResult.market_analysis.market_reasoning}</p>
                  </div>
                  <div className="max-w-3xl">
                    <h4 className="text-sm font-medium mb-1">Growth Potential</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{analysisResult.market_analysis.growth_potential}</p>
                  </div>
                  {analysisResult.market_analysis.source_summary && (
                    <p className="text-xs text-muted-foreground/70 italic border-t border-border/30 pt-3">
                      Estimates basis: {analysisResult.market_analysis.source_summary}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Competition Analysis */}
              <Card className="glass-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4 border-b border-border/40">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Users className="text-primary h-5 w-5" />
                    Competition Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  {analysisResult.competition_analysis.competitors.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {analysisResult.competition_analysis.competitors.map((competitor, i) => (
                        <CompetitorCard key={i} competitor={competitor} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific competitors identified. Re-run analysis for a more detailed description.</p>
                  )}
                  <div className="border-t border-border/40 pt-4">
                    <h4 className="mb-2 text-sm font-medium">Your Competitive Advantage</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {analysisResult.competition_analysis.competitive_advantage}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths & Risks */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="glass-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="flex items-center gap-2 text-green-600 text-xl font-semibold">
                      <CheckCircle className="h-5 w-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-3">
                      {analysisResult.viability_analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="flex items-center gap-2 text-amber-600 text-xl font-semibold">
                      <AlertCircle className="h-5 w-5" />
                      Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-3">
                      {analysisResult.viability_analysis.risks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                          <span className="text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card className="glass-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4 border-b border-border/40">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Lightbulb className="text-primary h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-4">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5 flex-shrink-0">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Investor Analysis — shown only when present */}
              {analysisResult.investor_analysis && (
                <Card className="glass-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                      <DollarSign className="text-primary h-5 w-5" />
                      Investor Simulation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {analysisResult.investor_analysis.bull_case && (
                      <div className="rounded-lg bg-green-500/8 border border-green-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-green-700">Bull Case</span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {analysisResult.investor_analysis.bull_case}
                        </p>
                      </div>
                    )}
                    {analysisResult.investor_analysis.bear_case && (
                      <div className="rounded-lg bg-red-500/8 border border-red-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-red-700">Bear Case</span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {analysisResult.investor_analysis.bear_case}
                        </p>
                      </div>
                    )}
                    {analysisResult.investor_analysis.key_questions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Diligence Questions</span>
                        </div>
                        <ul className="space-y-2">
                          {analysisResult.investor_analysis.key_questions.map((q, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {i + 1}
                              </span>
                              <span className="text-sm text-muted-foreground">{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Data Transparency Note */}
              {analysisResult._flags.length > 0 && (
                <Card className="glass-card border-amber-500/30 bg-amber-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-amber-700 mb-1">Data Verification Notice</h4>
                        <p className="text-xs text-amber-600">
                          Some fields in this analysis contain specific figures that may be estimated based on general industry patterns.
                          We recommend independently verifying any specific numbers before using them in business decisions.
                          Flagged fields: {analysisResult._flags.filter(f => f !== 'legacy_format' && f !== 'insufficient_input').join(', ') || 'general estimates'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              <Card className="glass-card border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div className="text-center md:text-left">
                      <h3 className="mb-1">Ready to validate your idea?</h3>
                      <p className="text-muted-foreground text-sm">
                        Join our community and get feedback from fellow founders
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={handleSaveReport}
                      >
                        Save Report
                      </Button>
                      <Button
                        onClick={handleShareToCommunity}
                        disabled={!analysisResult}
                        title={!analysisResult ? 'Analyze your idea to enable sharing.' : undefined}
                        className="gradient-lavender rounded-xl"
                      >
                        Share in Community
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* How It Works - When no results and not loading */}
          {!analysisResult && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12"
            >
              <h2 className="mb-4 text-center">How Our AI Analysis Works</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                <Card className="glass-card border-border/50 text-center">
                  <CardContent className="pt-6">
                    <div className="gradient-lavender mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-base">Market Analysis</h3>
                    <p className="text-muted-foreground text-sm">
                      We analyze market size, growth trends, and addressable opportunities
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50 text-center">
                  <CardContent className="pt-6">
                    <div className="gradient-lavender mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-base">Competition Check</h3>
                    <p className="text-muted-foreground text-sm">
                      Identify competitors and find your unique positioning
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50 text-center">
                  <CardContent className="pt-6">
                    <div className="gradient-lavender mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-base">Viability Score</h3>
                    <p className="text-muted-foreground text-sm">
                      Get an overall score based on multiple success factors
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Demo Section - See how AI analyzes your idea */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="mb-4 text-center">See how AI analyzes your idea</h2>
            <Card className="glass-card border-border/50 hover:border-primary/50 hover:shadow-lavender transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="flex-1">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="mb-2">AI-Powered Personal Finance Assistant</h3>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="rounded-full">
                            Fintech
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            Automation
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            Productivity
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm">
                      An AI-powered mobile app that automatically categorizes expenses, provides
                      personalized budgeting recommendations, and sends smart alerts to help users
                      achieve their financial goals. The app learns from user behavior to offer
                      increasingly accurate insights over time.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
                        onClick={() => setShowDemoReportModal(true)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Report
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-5 md:w-32 md:flex-col">
                    <div className="text-center">
                      <div className="flex items-baseline gap-0.5 justify-center">
                        <span className="text-3xl font-bold text-green-600">85</span>
                        <span className="text-base font-medium text-muted-foreground">/100</span>
                      </div>
                      <div className="text-muted-foreground text-xs mt-1">Viability Score</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Demo Idea Report Modal */}
      <Dialog open={showDemoReportModal} onOpenChange={setShowDemoReportModal}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Analysis Report</DialogTitle>
            <DialogDescription>
              Comprehensive analysis for AI-Powered Personal Finance Assistant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Idea Overview */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <Lightbulb className="text-primary h-5 w-5" />
                Idea Overview
              </h4>
              <Card className="glass-surface border-border/50">
                <CardContent className="text-muted-foreground p-4 text-sm">
                  An AI-powered mobile app targeting millennials and Gen Z users who want to improve
                  their financial literacy and achieve savings goals. The app uses machine learning
                  to provide personalized insights.
                </CardContent>
              </Card>
            </div>

            {/* Market Analysis */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <TrendingUp className="text-primary h-5 w-5" />
                Market Analysis
              </h4>
              <Card className="glass-surface border-border/50">
                <CardContent className="space-y-3 p-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Market Size:</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">Large Market</Badge>
                  </div>
                  <div>
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Reasoning</span>
                    <p className="text-muted-foreground mt-1">
                      Personal finance is a well-established market with proven consumer demand, validated by multiple publicly-traded companies in the space.
                      Estimated based on general industry patterns.
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Growth Potential</span>
                    <p className="text-muted-foreground mt-1">
                      Strong tailwinds from rising financial awareness among younger demographics
                      and increasing smartphone penetration globally.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competitor Insights */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <Users className="text-primary h-5 w-5" />
                Competition Analysis
              </h4>
              <Card className="glass-surface border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Direct Competition</span>
                    <p className="text-muted-foreground text-sm mt-1">
                      Established SaaS budgeting platforms (e.g. Mint, YNAB) dominate but lack deep AI personalization.
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Indirect Competition</span>
                    <p className="text-muted-foreground text-sm mt-1">
                      Spreadsheet-based budgeting, built-in banking app features, and manual financial advisors.
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Edge Needed</span>
                    <p className="text-muted-foreground text-sm mt-1">
                      Better mobile-first UX with gamification and behavioral finance insights
                      that incumbents currently lack.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Viability Assessment */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <Target className="text-primary h-5 w-5" />
                Viability Assessment
              </h4>
              <Card className="glass-surface border-border/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge className="border-0 bg-green-500 text-white">High Confidence</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    High viability based on validated market demand, proven business models in the space,
                    and a clear differentiator through AI personalization.
                    Key execution risk is user acquisition cost in a competitive fintech landscape.
                  </p>
                  <p className="text-xs italic text-muted-foreground/70">
                    Note: This assessment is based on qualitative reasoning, not fabricated statistics.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <div>
              <h4 className="mb-3 flex items-center gap-2">
                <Sparkles className="text-primary h-5 w-5" />
                AI Recommendations
              </h4>
              <Card className="glass-surface border-border/50">
                <CardContent className="space-y-3 p-4">
                  <div className="flex gap-3">
                    <Badge variant="outline" className="flex-shrink-0">
                      1
                    </Badge>
                    <p className="text-muted-foreground text-sm">
                      Focus on one specific user persona initially (e.g., freelancers with irregular
                      income)
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="flex-shrink-0">
                      2
                    </Badge>
                    <p className="text-muted-foreground text-sm">
                      Partner with banks for secure API access to simplify onboarding
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowDemoReportModal(false)}
              >
                Close
              </Button>
              <Button
                className="gradient-lavender shadow-lavender flex-1 rounded-xl hover:opacity-90"
                onClick={() => handleDownloadReport(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Clock,
  Trophy,
  Target,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lightbulb,
  BarChart2,
  Tag,
  Gauge,
  CalendarDays,
  Users,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { DifficultyBadge } from '../DifficultyBadge';
import { LeaderboardWidget, type ContributorEntry } from '../LeaderboardWidget';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { StarRating } from '../ui/star-rating';
import { Skeleton } from '../ui/skeleton';

import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { apiClient, CaseEvaluationResponse, CaseEvaluationBreakdown } from '@/lib/api-client';
import { useUser } from '@/contexts/UserContext';

interface CaseDetailPageProps {
  onNavigate?: (page: string) => void;
}

interface CaseData {
  id: string;
  company: string;
  title: string;
  description: string;
  problem: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tags: string[];
  publishedDate: string;
  constraints: string;
  expectedOutcome: string;
  hints: string[];
}

// ── Fetch top contributors via DB-side RPC ────────────────────────────────────
//
// Calls the get_case_leaderboard Postgres function which runs:
//   SELECT user_id, MAX(score::int) AS best_score, COUNT(*) AS attempts
//   FROM user_activity
//   WHERE type = 'case_completed' AND metadata->>'caseId' = p_case_id
//     AND score IS NOT NULL AND score ~ '^\d+$'
//   GROUP BY user_id ORDER BY best_score DESC LIMIT 5
//
// The DB does all aggregation — at most 5 rows cross the wire regardless of
// how many completion events exist. A second query joins profiles for UI data.
//
// score validation (^\d+$ guard + ::int cast) is enforced by the DB function;
// invalid or missing scores are excluded, not coerced to 0.
async function fetchContributors(caseId: string): Promise<ContributorEntry[]> {
  type RpcRow = { user_id: string; best_score: number; attempts: number };

  const { data, error } = await supabase.rpc('get_case_leaderboard', {
    p_case_id: caseId,
    p_limit:   5,
  });

  if (error || !data || (data as RpcRow[]).length === 0) return [];

  const rows = data as RpcRow[];

  // Join profiles for display name + avatar — at most 5 IDs
  const userIds = rows.map(r => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar')
    .in('id', userIds);

  const profileMap = new Map<string, { name: string; avatar: string }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, { name: p.name || 'User', avatar: p.avatar || '' });
  }

  return rows.map((row, index) => {
    const profile = profileMap.get(row.user_id) ?? { name: 'User', avatar: '' };
    return {
      rank:     index + 1,
      userId:   row.user_id,
      name:     profile.name,
      avatar:   profile.avatar,
      score:    row.best_score,
      attempts: Number(row.attempts), // bigint arrives as string in some drivers
    };
  });
}

function mapDifficulty(d: string): 'Easy' | 'Medium' | 'Hard' {
  if (d === 'Beginner') return 'Easy';
  if (d === 'Advanced') return 'Hard';
  return 'Medium';
}

export function CaseDetailPage({ onNavigate }: CaseDetailPageProps) {
  const { caseId } = useParams<{ caseId: string }>();
  const { user } = useUser();

  // Case data
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [caseLoading, setCaseLoading] = useState(true);

  // Solution editor
  const [solution, setSolution] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Evaluation
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);
  const [evalStage, setEvalStage] = useState<string | null>(null);
  const [evalProgress, setEvalProgress] = useState(0);
  const evalStageIndexRef = useRef(0);
  const evalStageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const evalProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const evalLongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evalStartTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const submitDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortToastTsRef = useRef<number>(0);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const rateLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate last result from sessionStorage on mount (keyed by caseId)
  const [evaluationData, setEvaluationData] = useState<CaseEvaluationResponse | null>(() => {
    if (!caseId) return null;
    try {
      const raw = sessionStorage.getItem(`eval:${caseId}`);
      return raw ? (JSON.parse(raw) as CaseEvaluationResponse) : null;
    } catch {
      return null;
    }
  });

  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // Contributors (sidebar)
  const [contributors, setContributors] = useState<ContributorEntry[]>([]);
  const [contributorsLoading, setContributorsLoading] = useState(true);

  // Exit warning
  const [showExitWarning, setShowExitWarning] = useState(false);

  // ── Fetch case study ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!caseId) {
      setCaseLoading(false);
      return;
    }
    setCaseLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('case_studies')
          .select('*')
          .eq('id', caseId)
          .single();
        if (error || !data) {
          setCaseData(null);
        } else {
          setCaseData({
            id: data.id,
            company: data.company || 'Case Study',
            title: data.title || 'Untitled Case Study',
            description: data.background || data.problem_statement || '',
            problem: data.problem_statement || '',
            difficulty: mapDifficulty(data.difficulty),
            category: data.category || 'General',
            tags: Array.isArray(data.tags)
              ? data.tags
              : typeof data.tags === 'string'
              ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
              : [],
            publishedDate: data.created_at
              ? new Date(data.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '',
            constraints: data.constraints || '',
            expectedOutcome: data.expected_outcome || '',
            hints: Array.isArray(data.hints) ? data.hints : [],
          });
        }
      } finally {
        setCaseLoading(false);
      }
    })();
  }, [caseId]);

  // ── Fetch contributors — depends only on stable caseId ───────────────────
  const loadContributors = useCallback(async () => {
    if (!caseId) return;
    setContributorsLoading(true);
    try {
      const entries = await fetchContributors(caseId);
      setContributors(entries);
    } catch {
      setContributors([]);
    } finally {
      setContributorsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadContributors();
  }, [loadContributors]);

  // ── Realtime: push-based leaderboard refresh on INSERT ────────────────────
  // Supabase realtime doesn't support JSONB path filters, so we subscribe to
  // all user_activity INSERTs and match caseId in the handler. Only one RPC
  // call is triggered per relevant event — all others are dropped in JS.
  useEffect(() => {
    if (!caseId) return;

    const channel = supabase
      .channel(`leaderboard-${caseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_activity' },
        (payload) => {
          const row = payload.new as { type?: string; metadata?: Record<string, unknown> } | null;
          if (row?.type !== 'case_completed') return;
          if (row.metadata?.caseId !== caseId) return;
          loadContributors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, loadContributors]);

  // ── Periodic sync (60 s) — catches events missed during realtime downtime ─
  useEffect(() => {
    if (!caseId) return;
    const id = setInterval(loadContributors, 60_000);
    return () => clearInterval(id);
  }, [caseId, loadContributors]);

  // ── Cancel in-flight evaluation and all timers on unmount ───────────────
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (evalStageIntervalRef.current) clearInterval(evalStageIntervalRef.current);
      if (evalProgressIntervalRef.current) clearInterval(evalProgressIntervalRef.current);
      if (evalLongTimeoutRef.current) clearTimeout(evalLongTimeoutRef.current);
      if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
      if (submitDebounceRef.current) clearTimeout(submitDebounceRef.current);
    };
  }, []);

  // ── Auto-save draft (debounced, local only — marks timestamp) ─────────────
  useEffect(() => {
    if (solution.length === 0) return;
    const timer = setTimeout(() => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 400);
    }, 2000);
    return () => clearTimeout(timer);
  }, [solution]);

  // ── Input validation — reject gibberish / spam / thin answers ───────────
  const validateInput = (text: string): string | null => {
    const BAD = 'Please write a clear and meaningful solution.';
    const trimmed = text.trim();

    // Minimum length
    if (trimmed.length < 80) return BAD;

    // Minimum word count (words > 1 char, i.e. not just punctuation/initials)
    const words = trimmed.split(/\s+/).filter(w => w.length > 1);
    if (words.length < 10) return BAD;

    // Unique word ratio < 40% → heavy padding or copy-paste loop
    const normalised = words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const unique = new Set(normalised.filter(Boolean));
    if (unique.size / normalised.length < 0.4) return BAD;

    // Any single word > 30% of total → spam (e.g. "AI AI AI AI AI…")
    const freq: Record<string, number> = {};
    for (const w of normalised) if (w) freq[w] = (freq[w] ?? 0) + 1;
    const maxFreq = Math.max(...Object.values(freq));
    if (maxFreq / normalised.length > 0.3) return BAD;

    // Repeated character runs (e.g. "aaaaaaa", "asdfasdf")
    if (/(.)\1{6,}/.test(trimmed)) return BAD;

    // Non-readable character ratio > 30%
    const nonReadable = (trimmed.match(/[^a-zA-Z0-9\s.,!?;:'"()\-–—]/g) ?? []).length;
    if (nonReadable / trimmed.length > 0.3) return BAD;

    return null;
  };

  // ── Stage labels — rotate every 2.5s independent of API ─────────────────
  const EVAL_STAGES = [
    'Analyzing your solution…',
    'Breaking down strategy…',
    'Evaluating feasibility…',
    'Generating feedback…',
    'Reviewing key points…',
    'Finalising your score…',
  ] as const;

  const stopEvalAnimation = () => {
    if (evalStageIntervalRef.current) {
      clearInterval(evalStageIntervalRef.current);
      evalStageIntervalRef.current = null;
    }
    if (evalProgressIntervalRef.current) {
      clearInterval(evalProgressIntervalRef.current);
      evalProgressIntervalRef.current = null;
    }
    if (evalLongTimeoutRef.current) {
      clearTimeout(evalLongTimeoutRef.current);
      evalLongTimeoutRef.current = null;
    }
    setEvalStage(null);
  };

  const startEvalAnimation = () => {
    evalStageIndexRef.current = 0;
    setEvalStage(EVAL_STAGES[0]);

    // Rotate stage label every 2.5s
    evalStageIntervalRef.current = setInterval(() => {
      evalStageIndexRef.current = (evalStageIndexRef.current + 1) % EVAL_STAGES.length;
      setEvalStage(EVAL_STAGES[evalStageIndexRef.current]);
    }, 2500);

    // After 15s, override with "taking longer" message without aborting
    evalLongTimeoutRef.current = setTimeout(() => {
      setEvalStage('Still working — complex solutions take longer…');
    }, 15_000);

    // Fake progress bar: starts fast, decelerates, caps at ~88%
    setEvalProgress(5);
    evalProgressIntervalRef.current = setInterval(() => {
      setEvalProgress(prev => {
        if (prev >= 88) return prev;
        const increment = Math.max(0.4, (88 - prev) * 0.045);
        return Math.min(88, prev + increment);
      });
    }, 400);
  };

  // ── Countdown teardown helper — used in multiple paths ───────────────────
  const clearRateLimitCountdown = () => {
    if (rateLimitTimerRef.current) {
      clearInterval(rateLimitTimerRef.current);
      rateLimitTimerRef.current = null;
    }
    setRateLimitCountdown(null);
  };

  // ── Evaluate solution via backend ─────────────────────────────────────────
  const runEvaluation = async () => {
    if (!caseData || isEvaluating) return;

    const validationError = validateInput(solution);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Cancel any prior in-flight request — throttle restart toast to once per 1.5s
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      const now = Date.now();
      if (now - abortToastTsRef.current > 1500) {
        abortToastTsRef.current = now;
        toast.info('Restarting evaluation…', { duration: 2000 });
      }
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    clearRateLimitCountdown();

    const evaluationId = crypto.randomUUID();
    const clampedSolution = solution.slice(0, 3000);
    const startTime = Date.now();
    evalStartTimeRef.current = startTime;

    if (import.meta.env.DEV) console.log('[Eval] start', new Date(startTime).toISOString());

    setIsEvaluating(true);
    startEvalAnimation();

    try {
      const evaluation = await apiClient.post<CaseEvaluationResponse>(
        '/api/ai/evaluate-case',
        {
          caseTitle:    caseData.title,
          caseId:       caseData.id,
          company:      caseData.company,
          problem:      caseData.problem,
          solution:     clampedSolution,
          evaluationId,
        },
        180_000,
        controller.signal,
        (attempt, total) => {
          // Show a friendly waking-up message during cold-start retries
          setEvalStage(
            attempt === 1
              ? 'Server is waking up — this takes ~15s on first load…'
              : `Still waking up, retrying… (${attempt}/${total})`
          );
          if (import.meta.env.DEV)
            console.log(`[Eval] cold-start retry ${attempt}/${total}`);
        }
      );

      const elapsed = Date.now() - startTime;
      if (import.meta.env.DEV)
        console.log('[Eval] success', `${elapsed}ms`, evaluation.score);

      // Jump progress to 100% smoothly before revealing result
      setEvalProgress(100);
      stopEvalAnimation();
      clearRateLimitCountdown();
      abortControllerRef.current = null;

      try {
        sessionStorage.setItem(`eval:${caseData.id}`, JSON.stringify(evaluation));
      } catch { /* quota exceeded — safe to ignore */ }

      // Enforce minimum 2.5s display so the animation doesn't flash and vanish
      const remaining = Math.max(0, 2500 - elapsed);
      await new Promise(r => setTimeout(r, remaining));

      setEvaluationData(evaluation);
      setShowEvaluationModal(true);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      stopEvalAnimation();
      setEvalProgress(0);

      if (err instanceof DOMException && err.name === 'AbortError') {
        if (import.meta.env.DEV) console.log('[Eval] aborted after', `${elapsed}ms`);
        return;
      }

      const raw = err instanceof Error ? err.message : '';
      if (import.meta.env.DEV) console.error('[Eval] error after', `${elapsed}ms`, raw);

      const waitMatch = raw.match(/try again in ~(\d+)s/i);
      if (waitMatch) {
        clearRateLimitCountdown();
        let secs = parseInt(waitMatch[1], 10);
        const attemptsMatch = raw.match(/(\d+)\s*(?:\/|of)\s*(\d+)\s*used/i);
        const attemptsLabel = attemptsMatch ? ` (${attemptsMatch[1]}/${attemptsMatch[2]} used)` : '';
        setRateLimitCountdown(secs);
        toast.error(`Too many submissions${attemptsLabel}. Try again in ${secs}s.`);
        rateLimitTimerRef.current = setInterval(() => {
          secs -= 1;
          if (secs <= 0) clearRateLimitCountdown();
          else setRateLimitCountdown(secs);
        }, 1000);
        return;
      }

      const isColdStartExhausted =
        raw.includes('Failed to fetch') ||
        raw.includes('backend server may be unavailable') ||
        raw.includes('NetworkError');
      if (isColdStartExhausted) {
        toast.error('Server is still starting up. Please wait 30 seconds and try again.');
        return;
      }

      const isUserFacing =
        raw.toLowerCase().includes('solution') ||
        raw.toLowerCase().includes('meaningful') ||
        raw.toLowerCase().includes('practical') ||
        raw.toLowerCase().includes('quickly') ||
        raw.toLowerCase().includes('circuit') ||
        raw.toLowerCase().includes('unavailable');
      toast.error(isUserFacing ? raw : 'Evaluation failed. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Debounced wrapper — prevents rapid double-clicks from firing two evaluations.
  // isSubmitLocked provides a ~100ms visual disable window immediately after the
  // debounce fires, before isEvaluating becomes true.
  const handleSubmit = () => {
    if (isSubmitLocked || isEvaluating) return;
    if (submitDebounceRef.current) clearTimeout(submitDebounceRef.current);
    setIsSubmitLocked(true);
    submitDebounceRef.current = setTimeout(() => {
      submitDebounceRef.current = null;
      setIsSubmitLocked(false);
      runEvaluation();
    }, 350);
  };

  const handleAfterEvaluation = () => {
    setShowEvaluationModal(false);
    // Refetch contributors so leaderboard reflects this submission
    loadContributors();
  };

  const handleBack = () => {
    if (solution.length > 10 && !lastSaved) {
      setShowExitWarning(true);
    } else {
      onNavigate?.('CaseStudies');
    }
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 400);
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (caseLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="border-border border-b bg-gradient-to-r from-[#C9A7EB]/10 to-transparent">
          <div className="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-36 mb-5 rounded-lg" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-6 w-64 rounded" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-5 w-14 rounded" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="space-y-6 lg:col-span-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!caseData) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Case study not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This case may have been removed or the link is incorrect.
          </p>
          <Button variant="outline" onClick={() => onNavigate?.('CaseStudies')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Case Studies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-border border-b bg-gradient-to-r from-[#C9A7EB]/10 to-transparent">
        <div className="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6 lg:px-8">
          <div className="mb-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="rounded-lg -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Case Studies
            </Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                {caseData.company}
              </p>
              <h1 className="text-xl font-bold leading-snug">{caseData.title}</h1>
            </div>
            <Button
              className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90 sm:flex-shrink-0"
              onClick={() =>
                document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Start Solving
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={caseData.difficulty} />
            <Badge variant="secondary" className="rounded-lg text-xs">
              {caseData.category}
            </Badge>
            {caseData.tags.map(tag => (
              <Badge key={tag} variant="outline" className="rounded-lg text-xs">
                {tag}
              </Badge>
            ))}
            {caseData.publishedDate && (
              <span className="ml-auto text-xs text-muted-foreground">{caseData.publishedDate}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">

          {/* LEFT — problem + workspace (8/12 cols on desktop) */}
          <div className="space-y-8 lg:col-span-8">

            {/* Problem Overview */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-5">
                {caseData.description && (
                  <div>
                    <h2 className="text-base font-semibold mb-2">Problem Overview</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {caseData.description}
                    </p>
                  </div>
                )}

                {caseData.problem && (
                  <div className="rounded-xl bg-muted/40 border border-border/40 p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary flex-shrink-0" />
                      The Challenge
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {caseData.problem}
                    </p>
                  </div>
                )}

                {caseData.expectedOutcome && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-primary flex-shrink-0" />
                      Expected Outcome
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {caseData.expectedOutcome}
                    </p>
                  </div>
                )}

                {caseData.constraints && (
                  <div className="rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-800/40 p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-orange-700 dark:text-orange-400">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      Constraints
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {caseData.constraints}
                    </p>
                  </div>
                )}

                {caseData.hints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      Hints
                    </h3>
                    <ul className="space-y-1.5">
                      {caseData.hints.map((hint, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Details bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/50 bg-card p-4 flex flex-col items-center gap-2 text-center">
                <Clock className="h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Est. Time</p>
                <p className="text-sm font-semibold">45 min</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4 flex flex-col items-center gap-2 text-center">
                <Target className="h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Difficulty</p>
                <p className="text-sm font-semibold">{caseData.difficulty}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4 flex flex-col items-center gap-2 text-center">
                <Trophy className="h-5 w-5 text-amber-500" />
                <p className="text-xs text-muted-foreground">Pass Mark</p>
                <p className="text-sm font-semibold">70 / 100</p>
              </div>
            </div>

            {/* Workspace */}
            <Card id="workspace" className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Your Solution</CardTitle>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Saving…</span>
                      </>
                    ) : lastSaved ? (
                      <span>Saved {lastSaved.toLocaleTimeString()}</span>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {!user && (
                  <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 p-3 text-sm text-amber-800 dark:text-amber-300">
                    Sign in to submit and track your attempts.
                  </div>
                )}
                <Textarea
                  value={solution}
                  onChange={e => setSolution(e.target.value)}
                  placeholder={`Describe your solution strategy here…\n\n• What approach would you take?\n• How would you measure success?\n• What's your execution timeline?\n• What risks would you mitigate?`}
                  className="mb-1 min-h-[300px] resize-none rounded-xl"
                  aria-describedby="solution-hint"
                  aria-label="Your solution"
                />
                {/* Character count hints — referenced by aria-describedby */}
                <div id="solution-hint" className="mb-3 flex justify-between text-xs">
                  {solution.length > 0 && solution.length < 80 ? (
                    <span className="text-muted-foreground">
                      {80 - solution.length} more characters needed to submit.
                    </span>
                  ) : solution.length >= 2700 ? (
                    <span className={solution.length >= 3000 ? 'text-destructive' : 'text-amber-500'}>
                      {solution.length}/3000 characters
                      {solution.length >= 3000 && ' — limit reached, excess will be trimmed'}
                    </span>
                  ) : (
                    <span />
                  )}
                  {solution.length >= 80 && solution.length < 2700 && (
                    <span className="text-muted-foreground ml-auto">{solution.length} chars</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSaving || solution.length === 0 || isEvaluating}
                    className="rounded-xl"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button
                    className={`gradient-lavender shadow-lavender flex-1 rounded-xl hover:opacity-90 transition-all${isEvaluating ? ' opacity-90' : ''}`}
                    onClick={handleSubmit}
                    disabled={solution.length < 80 || isEvaluating || isSubmitLocked || rateLimitCountdown !== null}
                    aria-busy={isEvaluating}
                    aria-label={
                      isEvaluating
                        ? (evalStage ?? 'Evaluating…')
                        : rateLimitCountdown !== null
                        ? `Submission blocked. Try again in ${rateLimitCountdown} seconds`
                        : 'Submit solution for evaluation'
                    }
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        <span
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                          className="transition-opacity duration-200"
                          key={evalStage}
                        >
                          {evalStage ?? 'Evaluating…'}
                        </span>
                      </>
                    ) : rateLimitCountdown !== null ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
                        Try again in {rateLimitCountdown}s
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                        Submit Solution
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress bar — visible only while evaluating */}
                {isEvaluating && (
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${evalProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {evalProgress < 30
                        ? 'Reading your solution…'
                        : evalProgress < 60
                        ? 'Evaluating strategy and depth…'
                        : evalProgress < 88
                        ? 'Scoring and writing feedback…'
                        : 'Wrapping up…'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skeleton loading card — shown while evaluation is in flight */}
            {isEvaluating && (
              <Card className="border-border/50 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Preparing your result…
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 w-full rounded-full bg-muted animate-pulse" />
                      <div className="h-2.5 w-2/3 rounded-full bg-muted animate-pulse" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-muted/30 p-4 space-y-3">
                    {['Clarity', 'Strategy', 'Feasibility', 'Depth'].map(d => (
                      <div key={d}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground/60">{d}</span>
                          <div className="h-3 w-6 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-muted animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-4/6 rounded bg-muted animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attempts history (shown after at least one evaluation) */}
            {evaluationData && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    Your Latest Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Score + verdict row */}
                  <div className="flex items-center gap-5">
                    <div className="text-center flex-shrink-0">
                      <p className="text-5xl font-bold text-primary leading-none">{evaluationData.score}</p>
                      <p className="text-xs text-muted-foreground mt-1">out of 100</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Progress value={evaluationData.score} className="h-2.5" />
                      <div
                        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                          evaluationData.verdict === 'Strong Solution'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : evaluationData.verdict === 'Good Effort'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {evaluationData.verdict === 'Strong Solution' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {evaluationData.verdict}
                      </div>
                    </div>
                  </div>

                  {/* Breakdown bars */}
                  {evaluationData.breakdown && (
                    <div className="rounded-xl bg-muted/40 border border-border/40 p-4 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score Breakdown</p>
                      {(
                        [
                          { key: 'clarity',     label: 'Clarity' },
                          { key: 'strategy',    label: 'Strategy' },
                          { key: 'feasibility', label: 'Feasibility' },
                          { key: 'depth',       label: 'Depth' },
                        ] as { key: keyof CaseEvaluationBreakdown; label: string }[]
                      ).map(({ key, label }) => {
                        const val = evaluationData.breakdown![key] ?? 0;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium">{val}</span>
                            </div>
                            <Progress value={val} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Strengths */}
                  {(evaluationData.strengths ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                      </p>
                      <ul className="space-y-2">
                        {evaluationData.strengths!.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {(evaluationData.improvements ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> Areas to Improve
                      </p>
                      <ul className="space-y-2">
                        {evaluationData.improvements!.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="text-orange-500 flex-shrink-0 mt-0.5">→</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl text-xs"
                    onClick={() => {
                      const bd = evaluationData.breakdown;
                      const lines = [
                        `Case Study Report — ${caseData.title}`,
                        `Score: ${evaluationData.score}/100`,
                        `Verdict: ${evaluationData.verdict}`,
                        '',
                        ...(bd ? [
                          'Breakdown:',
                          `  Clarity:     ${bd.clarity}`,
                          `  Strategy:    ${bd.strategy}`,
                          `  Feasibility: ${bd.feasibility}`,
                          `  Depth:       ${bd.depth}`,
                          '',
                        ] : []),
                        'Strengths:',
                        ...(evaluationData.strengths ?? []).map(s => `  • ${s}`),
                        '',
                        'Areas for Improvement:',
                        ...(evaluationData.improvements ?? []).map(s => `  • ${s}`),
                      ];
                      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `case-study-report-${caseData.id}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Export Report
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT sidebar (4/12 cols on desktop, stacks below on mobile/tablet) */}
          <div className="space-y-5 lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
            {/* Top Contributors — real data */}
            <LeaderboardWidget
              entries={contributors}
              isLoading={contributorsLoading}
            />

            {/* Your Progress card */}
            {user && (
              <Card className="border-border/50">
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  {evaluationData ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm py-1">
                        <span className="text-muted-foreground">Best Score</span>
                        <span className="font-bold text-primary">{evaluationData.score}/100</span>
                      </div>
                      <Progress value={evaluationData.score} className="h-1.5" />
                      <div className="border-t border-border/40 pt-3 flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          className={`border-0 text-xs ${
                            evaluationData.verdict === 'Strong Solution'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : evaluationData.verdict === 'Good Effort'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                        >
                          {evaluationData.verdict}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Submit a solution to track your progress.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Case Info card */}
            <Card className="border-border/50 overflow-hidden">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-border/40 bg-muted/30">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Case Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x divide-y divide-border/40">
                  {/* Category */}
                  <div className="flex flex-col gap-1 px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      <Tag className="h-3 w-3 flex-shrink-0" />
                      Category
                    </span>
                    <span className="text-sm font-semibold text-foreground leading-snug">
                      {caseData.category}
                    </span>
                  </div>

                  {/* Difficulty */}
                  <div className="flex flex-col gap-1 px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      <Gauge className="h-3 w-3 flex-shrink-0" />
                      Difficulty
                    </span>
                    <span className={`text-sm font-semibold leading-snug ${
                      caseData.difficulty === 'Hard'
                        ? 'text-red-500'
                        : caseData.difficulty === 'Medium'
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                    }`}>
                      {caseData.difficulty}
                    </span>
                  </div>

                  {/* Contributors */}
                  <div className="flex flex-col gap-1 px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      Contributors
                    </span>
                    <span className="text-sm font-semibold text-foreground leading-snug">
                      {contributors.length}
                    </span>
                  </div>

                  {/* Published */}
                  <div className="flex flex-col gap-1 px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      <CalendarDays className="h-3 w-3 flex-shrink-0" />
                      Published
                    </span>
                    <span className="text-sm font-semibold text-foreground leading-snug">
                      {caseData.publishedDate || '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Evaluation Modal ───────────────────────────────────────────────── */}
      <Dialog open={showEvaluationModal} onOpenChange={setShowEvaluationModal}>
        <DialogContent className="sm:max-w-[500px]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                Solution Evaluated
              </DialogTitle>
            </DialogHeader>

            {evaluationData && (
              <div className="space-y-5 py-4">
                {/* Score */}
                <div className="text-center">
                  <p className="text-6xl font-bold text-primary mb-1">{evaluationData.score}</p>
                  <p className="text-sm text-muted-foreground">out of 100</p>
                  <Progress value={evaluationData.score} className="mt-3 h-2" />
                </div>

                {/* Verdict */}
                <div className="text-center">
                  <div
                    className={`inline-flex items-center gap-2 ${
                      evaluationData.verdict === 'Strong Solution'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : evaluationData.verdict === 'Good Effort'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {evaluationData.verdict === 'Strong Solution' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span className="text-lg font-semibold">{evaluationData.verdict}</span>
                  </div>
                </div>

                {/* Breakdown */}
                {evaluationData.breakdown && (
                  <div className="rounded-xl bg-muted/40 border border-border/40 p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Breakdown</p>
                    {(
                      [
                        { key: 'clarity',     label: 'Clarity' },
                        { key: 'strategy',    label: 'Strategy' },
                        { key: 'feasibility', label: 'Feasibility' },
                        { key: 'depth',       label: 'Depth' },
                      ] as { key: keyof CaseEvaluationBreakdown; label: string }[]
                    ).map(({ key, label }) => {
                      const val = evaluationData.breakdown![key] ?? 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium">{val}</span>
                          </div>
                          <Progress value={val} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Strengths */}
                {(evaluationData.strengths ?? []).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Strengths
                    </h4>
                    <ul className="space-y-1.5">
                      {evaluationData.strengths!.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-emerald-500 flex-shrink-0">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {(evaluationData.improvements ?? []).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" /> Areas for Improvement
                    </h4>
                    <ul className="space-y-1.5">
                      {evaluationData.improvements!.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-orange-500 flex-shrink-0">→</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rate */}
                <div className="border-t pt-4 space-y-2">
                  <p className="text-sm font-medium text-center">Rate this case study</p>
                  <div className="flex justify-center">
                    <StarRating rating={userRating} onRatingChange={setUserRating} size="lg" />
                  </div>
                  {userRating > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Thanks for your feedback!
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={handleAfterEvaluation}
                  >
                    Close
                  </Button>
                  <Button
                    className="gradient-lavender flex-1 rounded-xl hover:opacity-90"
                    onClick={() => {
                      handleAfterEvaluation();
                      onNavigate?.('CaseStudies');
                    }}
                  >
                    More Cases
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* ── Exit Warning Modal ─────────────────────────────────────────────── */}
      <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Progress</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-3">
            <Button
              className="gradient-lavender flex-1 rounded-xl hover:opacity-90"
              onClick={() => setShowExitWarning(false)}
            >
              Stay
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl"
              onClick={() => {
                setShowExitWarning(false);
                onNavigate?.('CaseStudies');
              }}
            >
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

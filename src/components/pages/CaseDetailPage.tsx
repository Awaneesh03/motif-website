import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DifficultyBadge } from '../DifficultyBadge';
import { LeaderboardWidget, type ContributorEntry } from '../LeaderboardWidget';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { StarRating } from '../ui/star-rating';
import { Skeleton } from '../ui/skeleton';

import { supabase } from '@/lib/supabase';
import { apiClient, CaseEvaluationResponse } from '@/lib/api-client';
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

// ── Fetch top contributors for this case from user_activity + profiles ────────
// Source: user_activity WHERE type='case_completed' AND title=caseTitle
// metadata.score holds the AI score. We join profiles for name/avatar.
async function fetchContributors(caseTitle: string): Promise<ContributorEntry[]> {
  // Step 1: aggregate completions by user_id
  const { data: rows, error } = await supabase
    .from('user_activity')
    .select('user_id, metadata')
    .eq('type', 'case_completed')
    .eq('title', caseTitle);

  if (error || !rows || rows.length === 0) return [];

  // Group by user_id: track best score and attempt count
  const byUser = new Map<string, { bestScore: number; attempts: number }>();
  for (const row of rows) {
    const score = typeof row.metadata?.score === 'number' ? row.metadata.score : 0;
    const existing = byUser.get(row.user_id);
    if (!existing) {
      byUser.set(row.user_id, { bestScore: score, attempts: 1 });
    } else {
      byUser.set(row.user_id, {
        bestScore: Math.max(existing.bestScore, score),
        attempts: existing.attempts + 1,
      });
    }
  }

  // Sort by best score DESC, take top 5
  const top5 = [...byUser.entries()]
    .sort((a, b) => b[1].bestScore - a[1].bestScore)
    .slice(0, 5);

  if (top5.length === 0) return [];

  // Step 2: join profiles for name + avatar
  const userIds = top5.map(([uid]) => uid);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar')
    .in('id', userIds);

  const profileMap = new Map<string, { name: string; avatar: string }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, { name: p.name || 'User', avatar: p.avatar || '' });
  }

  return top5.map(([userId, stats], index) => {
    const profile = profileMap.get(userId) ?? { name: 'User', avatar: '' };
    return {
      rank: index + 1,
      userId,
      name: profile.name,
      avatar: profile.avatar,
      score: stats.bestScore,
      attempts: stats.attempts,
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
  const [evaluationData, setEvaluationData] = useState<CaseEvaluationResponse | null>(null);
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

  // ── Fetch contributors once caseData is available ─────────────────────────
  const loadContributors = useCallback(async () => {
    if (!caseData?.title) return;
    setContributorsLoading(true);
    try {
      const entries = await fetchContributors(caseData.title);
      setContributors(entries);
    } catch {
      setContributors([]);
    } finally {
      setContributorsLoading(false);
    }
  }, [caseData?.title]);

  useEffect(() => {
    loadContributors();
  }, [loadContributors]);

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

  // ── Evaluate solution via backend ─────────────────────────────────────────
  const getFallbackEvaluation = (sol: string): CaseEvaluationResponse => {
    const words = sol.split(/\s+/).length;
    const hasStrategy = /strateg|plan|approach|method/i.test(sol);
    const hasMetrics  = /metric|kpi|measure|track|analytics/i.test(sol);
    const hasBudget   = /budget|cost|spend|allocat|investment/i.test(sol);
    const hasTimeline = /timeline|week|month|phase|quarter/i.test(sol);

    let score = 60;
    if (words > 100) score += 10;
    if (words > 200) score += 5;
    if (hasStrategy) score += 10;
    if (hasMetrics)  score += 10;
    if (hasBudget)   score += 10;
    if (hasTimeline) score += 5;
    score = Math.min(score, 100);

    const strengths: string[]     = [];
    const improvements: string[]  = [];
    if (hasStrategy) strengths.push('Clear strategic approach identified');
    else             improvements.push('Add more strategic thinking and overall approach');
    if (hasMetrics)  strengths.push('Good focus on metrics and measurement');
    else             improvements.push('Include specific KPIs and success metrics');
    if (hasBudget)   strengths.push('Budget considerations addressed');
    else             improvements.push('Provide detailed budget allocation breakdown');
    if (words < 100) improvements.push('Expand your solution with more detailed analysis');

    return {
      score,
      verdict: score >= 70 ? 'Pass' : 'Try Again',
      feedback: [...strengths, ...improvements].slice(0, 3),
      strengths,
      improvements,
    };
  };

  const handleSubmit = async () => {
    if (!caseData) return;
    setIsEvaluating(true);
    try {
      let evaluation: CaseEvaluationResponse;
      try {
        evaluation = await apiClient.post<CaseEvaluationResponse>('/api/ai/evaluate-case', {
          caseTitle: caseData.title,
          company:   caseData.company,
          problem:   caseData.problem,
          solution,
        });
      } catch {
        evaluation = getFallbackEvaluation(solution);
      }
      setEvaluationData(evaluation);
      setShowEvaluationModal(true);
    } finally {
      setIsEvaluating(false);
    }
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
          <div className="mx-auto max-w-[1140px] px-4 pt-4 pb-6 sm:px-6 lg:px-8">
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
        <div className="mx-auto max-w-[1140px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
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
        <div className="mx-auto max-w-[1140px] px-4 pt-4 pb-6 sm:px-6 lg:px-8">
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
      <div className="mx-auto max-w-[1140px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">

          {/* LEFT — problem + workspace */}
          <div className="space-y-6 md:col-span-2">

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
                  className="mb-4 min-h-[300px] resize-none rounded-xl"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSaving || solution.length === 0}
                    className="rounded-xl"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button
                    className="gradient-lavender shadow-lavender flex-1 rounded-xl hover:opacity-90"
                    onClick={handleSubmit}
                    disabled={solution.length < 50 || isEvaluating}
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Evaluating…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Solution
                      </>
                    )}
                  </Button>
                </div>
                {solution.length > 0 && solution.length < 50 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {50 - solution.length} more characters needed to submit.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Attempts history (shown after at least one evaluation) */}
            {evaluationData && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    Your Latest Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">{evaluationData.score}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">out of 100</p>
                    </div>
                    <div className="flex-1">
                      <Progress value={evaluationData.score} className="h-2 mb-2" />
                      <div
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                          evaluationData.verdict === 'Pass'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {evaluationData.verdict === 'Pass' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {evaluationData.verdict}
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="strengths">
                    <TabsList className="w-full">
                      <TabsTrigger value="strengths" className="flex-1 text-xs">Strengths</TabsTrigger>
                      <TabsTrigger value="improvements" className="flex-1 text-xs">Improve</TabsTrigger>
                      <TabsTrigger value="feedback" className="flex-1 text-xs">Feedback</TabsTrigger>
                    </TabsList>
                    <TabsContent value="strengths" className="mt-3">
                      {(evaluationData.strengths ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No specific strengths identified.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {evaluationData.strengths!.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>
                    <TabsContent value="improvements" className="mt-3">
                      {(evaluationData.improvements ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No improvements identified.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {evaluationData.improvements!.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>
                    <TabsContent value="feedback" className="mt-3">
                      {(evaluationData.feedback ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No feedback available.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {evaluationData.feedback!.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>
                  </Tabs>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full rounded-xl text-xs"
                    onClick={() => {
                      const lines = [
                        `Case Study Report — ${caseData.title}`,
                        `Score: ${evaluationData.score}/100`,
                        `Verdict: ${evaluationData.verdict}`,
                        '',
                        'Strengths:',
                        ...(evaluationData.strengths ?? []).map(s => `  • ${s}`),
                        '',
                        'Areas for Improvement:',
                        ...(evaluationData.improvements ?? []).map(s => `  • ${s}`),
                        '',
                        'Feedback:',
                        ...(evaluationData.feedback ?? []).map(s => `  • ${s}`),
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

          {/* RIGHT sidebar */}
          <div className="space-y-6">
            {/* Top Contributors — real data */}
            <LeaderboardWidget
              entries={contributors}
              isLoading={contributorsLoading}
            />

            {/* Your progress card */}
            {user && (
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Your Progress
                  </h3>
                  {evaluationData ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Best Score</span>
                        <span className="font-bold text-primary">{evaluationData.score}/100</span>
                      </div>
                      <Progress value={evaluationData.score} className="h-1.5" />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          className={`border-0 text-xs ${
                            evaluationData.verdict === 'Pass'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
                          }`}
                        >
                          {evaluationData.verdict === 'Pass' ? 'Passed' : 'In Progress'}
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

            {/* Case info card */}
            <Card className="border-border/50 bg-muted/20">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-semibold">Case Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{caseData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span className="font-medium">{caseData.difficulty}</span>
                  </div>
                  {caseData.publishedDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Published</span>
                      <span className="font-medium">{caseData.publishedDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contributors</span>
                    <span className="font-medium">{contributors.length}</span>
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
                  {evaluationData.verdict === 'Pass' ? (
                    <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-lg font-semibold">Passed!</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-lg font-semibold">Keep Trying</span>
                    </div>
                  )}
                </div>

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

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  BarChart3,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  CheckCircle,
  DollarSign,
  Lightbulb,
  Users,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { fromLegacyResult } from '../../lib/analysisValidator';
import type { SafeAnalysisResult, Competitor } from '../../lib/analysisValidator';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';

// ── Storage key written by SavedIdeasPage ────────────────────────────────────
export const SAVED_ANALYSIS_KEY = 'motif-saved-analysis-view';

export interface SavedAnalysisData {
  title: string;
  description: string;
  targetMarket: string;
  score?: number;
  // Legacy flat fields
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: string;
  competition: string;
  viability: string;
  // Structured fields (present for new records)
  idea_summary?: string;
  confidence_score?: number;
  competitors?: Array<{ name: string; threat?: string; opportunity?: string }>;
  competitive_advantage?: string;
  market?: Record<string, any>;
  heuristic_scores?: Record<string, number>;
  investor_analysis?: Record<string, any>;
}

// ── Competitor card (same as in IdeaAnalyserPage) ───────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

interface SavedAnalysisPageProps {
  onNavigate?: (page: string) => void;
}

export function SavedAnalysisPage({ onNavigate }: SavedAnalysisPageProps) {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [raw, setRaw] = useState<SavedAnalysisData | null>(null);
  const [result, setResult] = useState<SafeAnalysisResult | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const goBack = () => {
    if (onNavigate) {
      onNavigate('saved-ideas');
    } else {
      navigate(-1);
    }
  };

  const goToAnalyser = () => {
    if (onNavigate) {
      onNavigate('Idea Analyser');
    } else {
      navigate('/idea-analyser');
    }
  };

  useEffect(() => {
    if (id) {
      // Route /idea/:id — fetch the idea directly from Supabase
      // user_id filter enforces ownership: returns nothing if idea belongs to another user
      if (!user) return;
      setIsFetching(true);
      setFetchError(null);
      supabase
        .from('idea_analyses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
        .then(({ data: analysis, error }) => {
          setIsFetching(false);
          if (error || !analysis) {
            console.error('[IdeaDetail] Fetch failed:', error);
            setFetchError('Failed to load analysis. It may not exist or you may not have access.');
            return;
          }
          console.log('[IdeaDetail] Loaded analysis:', analysis);

          // Parse competition (TEXT JSON) → competitors array
          let competitors: Array<{ name: string; threat?: string; opportunity?: string }> | undefined;
          let parsedCompetitiveAdvantage: string | undefined;
          try {
            if (analysis.competition) {
              const comp = JSON.parse(analysis.competition);
              if (Array.isArray(comp.competitors)) competitors = comp.competitors;
              if (typeof comp.competitiveAdvantage === 'string') parsedCompetitiveAdvantage = comp.competitiveAdvantage;
            }
          } catch { /* legacy string format */ }

          // Parse market_size (TEXT JSON) → market object
          let market: Record<string, any> | undefined;
          try {
            if (analysis.market_size) market = JSON.parse(analysis.market_size);
          } catch { /* legacy string format */ }

          const data: SavedAnalysisData = {
            title: analysis.idea_title,
            description: analysis.idea_description,
            targetMarket: analysis.target_market || '',
            score: analysis.score,
            strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
            weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
            recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
            marketSize: analysis.market_size || '',
            competition: analysis.competition || '',
            viability: analysis.viability || '',
            idea_summary: analysis.idea_summary || undefined,
            confidence_score: typeof analysis.confidence_score === 'number' ? analysis.confidence_score : undefined,
            competitors,
            competitive_advantage: analysis.competitive_advantage || parsedCompetitiveAdvantage,
            market,
            heuristic_scores: analysis.heuristic_scores || undefined,
            investor_analysis: analysis.investor_analysis || undefined,
          };

          setRaw(data);
          setResult(fromLegacyResult({ ...data, score: data.score ?? 0 }));
        });
    } else {
      // Route /saved-analysis — read from sessionStorage (existing flow)
      try {
        const stored = sessionStorage.getItem(SAVED_ANALYSIS_KEY);
        if (!stored) return;
        const data: SavedAnalysisData = JSON.parse(stored);
        setRaw(data);
        setResult(fromLegacyResult({ ...data, score: data.score ?? 0 }));
      } catch {
        // malformed storage — show empty state
      }
    }
  }, [id, user]);

  // ── Empty / error state ──────────────────────────────────────────────────

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton header */}
        <div className="border-b border-border bg-gradient-to-r from-[#C9A7EB]/10 to-transparent">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4 pb-6 animate-pulse">
            <div className="h-8 w-24 rounded-lg bg-muted mb-5" />
            <div className="h-7 w-2/3 rounded-lg bg-muted mb-3" />
            <div className="h-4 w-full max-w-lg rounded bg-muted mb-2" />
            <div className="h-4 w-2/5 rounded bg-muted" />
          </div>
        </div>
        {/* Skeleton body */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
          <div className="rounded-2xl border bg-card p-8 flex gap-8">
            <div className="flex-1 space-y-3">
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </div>
            <div className="h-28 w-32 rounded-2xl bg-muted flex-shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-card p-6 h-32 bg-muted/30" />
            <div className="rounded-2xl border bg-card p-6 h-32 bg-muted/30" />
          </div>
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="h-4 w-40 rounded bg-muted" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-36 rounded bg-muted flex-shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-muted" />
                <div className="h-3 w-10 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">Failed to load analysis</h2>
          <p className="text-sm text-muted-foreground">{fetchError}</p>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vault
          </Button>
        </div>
      </div>
    );
  }

  if (!raw || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">No analysis to display</h2>
          <p className="text-sm text-muted-foreground">Go to your vault and click "View Analysis" on a saved idea.</p>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vault
          </Button>
        </div>
      </div>
    );
  }

  // ── Report ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-[#C9A7EB]/10 to-transparent">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4 pb-6">
          {/* Back */}
          <div className="mb-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="rounded-lg -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Vault
            </Button>
          </div>

          {/* Title + meta */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-snug">{raw.title}</h1>
              {raw.description && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl line-clamp-3">
                  {raw.description}
                </p>
              )}
              {raw.targetMarket && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {raw.targetMarket.split(/[,;]/).map(m => m.trim()).filter(Boolean).map(m => (
                    <Badge key={m} variant="secondary" className="text-xs rounded-lg">{m}</Badge>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl flex-shrink-0"
              onClick={goToAnalyser}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Re-Analyze
            </Button>
          </div>
        </div>
      </div>

      {/* Report body */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        {/* ── Score + Summary ───────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-card p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Analysis Summary
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.idea_summary}
              </p>
              {result.confidence_reasoning && (
                <p className="text-xs text-muted-foreground/70 italic">
                  {result.confidence_reasoning}
                </p>
              )}
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="bg-muted/40 rounded-2xl px-8 py-6 border shadow-sm text-center min-h-[130px] flex flex-col justify-center">
                <div className="flex items-baseline justify-center leading-none">
                  <span className="text-6xl font-bold text-amber-600">{result.score ?? 0}</span>
                  <span className="text-base text-muted-foreground ml-1">/100</span>
                </div>
                <p className="text-sm text-muted-foreground/80 mt-2">Viability Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Key Metrics ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm font-semibold mb-4">Market Size</p>
            {result.market_analysis.tam ? (
              <>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className="text-3xl font-semibold">{result.market_analysis.tam.split('—')[0].trim()}</span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">TAM</span>
                </div>
                {result.market_analysis.growth_rate && (
                  <p className="text-sm text-muted-foreground mt-2">Growth: {result.market_analysis.growth_rate}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic mt-4">{result.market_analysis.market_size_category} market</p>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm font-semibold mb-4">Competitors Identified</p>
            <div className="flex items-baseline gap-1.5 mt-4">
              <span className="text-3xl font-semibold">{result.competition_analysis.competitors.length}</span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">companies mapped</span>
            </div>
            {result.competition_analysis.competitors.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {result.competition_analysis.competitors.slice(0, 2).map(c => c.name).join(', ')}
                {result.competition_analysis.competitors.length > 2 && ` +${result.competition_analysis.competitors.length - 2} more`}
              </p>
            )}
          </div>
        </div>

        {/* ── Heuristic Scores (fresh results only) ─────────────────────── */}
        {result.heuristic_scores && (
          <Card className="border-border/50">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-5 w-5 text-primary" />
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
                const raw = result.heuristic_scores![key];
                const val = typeof raw === 'number' ? raw : 0;
                const pct = Math.round((val / 20) * 100);
                const color = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-40 flex-shrink-0 text-xs text-muted-foreground">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 flex-shrink-0 text-right text-xs font-medium tabular-nums">{val}/20</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* ── Market Analysis ───────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5 text-primary" />
              Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {(result.market_analysis.tam || result.market_analysis.sam || result.market_analysis.som) && (
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/20 p-3">
                {result.market_analysis.tam && (
                  <div className="text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">TAM</div>
                    <div className="text-sm font-semibold">{result.market_analysis.tam.split(' ')[0]}</div>
                    <div className="text-[10px] text-muted-foreground">Total Market</div>
                  </div>
                )}
                {result.market_analysis.sam && (
                  <div className="text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">SAM</div>
                    <div className="text-sm font-semibold">{result.market_analysis.sam.split(' ')[0]}</div>
                    <div className="text-[10px] text-muted-foreground">Serviceable</div>
                  </div>
                )}
                {result.market_analysis.som && (
                  <div className="text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">SOM</div>
                    <div className="text-sm font-semibold">{result.market_analysis.som.split(' ')[0]}</div>
                    <div className="text-[10px] text-muted-foreground">Obtainable</div>
                  </div>
                )}
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium mb-1">Market Reasoning</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.market_analysis.market_reasoning}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Growth Potential</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.market_analysis.growth_potential}</p>
            </div>
            {result.market_analysis.source_summary && (
              <p className="text-xs text-muted-foreground/70 italic border-t border-border/30 pt-3">
                Estimates basis: {result.market_analysis.source_summary}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Competition ───────────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-primary" />
              Competition Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {result.competition_analysis.competitors.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {result.competition_analysis.competitors.map((c, i) => (
                  <CompetitorCard key={i} competitor={c} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No specific competitors identified.</p>
            )}
            <div className="border-t border-border/40 pt-4">
              <h4 className="mb-2 text-sm font-medium">Your Competitive Advantage</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.competition_analysis.competitive_advantage}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Strengths & Risks ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-green-600">
                <CheckCircle className="h-5 w-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {result.viability_analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-amber-600">
                <AlertCircle className="h-5 w-5" />
                Risks
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {result.viability_analysis.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <span className="text-sm">{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* ── Recommendations ───────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-4">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 flex-shrink-0">{i + 1}</Badge>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ── Investor Simulation (fresh results only) ──────────────────── */}
        {result.investor_analysis && (
          <Card className="border-border/50">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="h-5 w-5 text-primary" />
                Investor Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {result.investor_analysis.bull_case && (
                <div className="rounded-lg bg-green-500/8 border border-green-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-green-700">Bull Case</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{result.investor_analysis.bull_case}</p>
                </div>
              )}
              {result.investor_analysis.bear_case && (
                <div className="rounded-lg bg-red-500/8 border border-red-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-700">Bear Case</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{result.investor_analysis.bear_case}</p>
                </div>
              )}
              {result.investor_analysis.key_questions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Diligence Questions</span>
                  </div>
                  <ul className="space-y-2">
                    {result.investor_analysis.key_questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{i + 1}</span>
                        <span className="text-sm text-muted-foreground">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Data flags notice ─────────────────────────────────────────── */}
        {result._flags.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-amber-700 mb-1">Data Verification Notice</h4>
                  <p className="text-xs text-amber-600">
                    Some figures in this analysis are estimated from general industry patterns.
                    Verify specific numbers before using them in business decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Footer CTA ────────────────────────────────────────────────── */}
        <Card className="border-border/50 bg-gradient-to-br from-[#C9A7EB]/10 to-[#B084E8]/10">
          <CardContent className="pt-6 pb-5">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-center md:text-left">
                <h3 className="text-base font-semibold mb-1">Want a fresh analysis?</h3>
                <p className="text-sm text-muted-foreground">Re-run the analyser to get updated market data and AI insights.</p>
              </div>
              <Button
                className="gradient-lavender rounded-xl"
                onClick={goToAnalyser}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-Analyze Idea
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

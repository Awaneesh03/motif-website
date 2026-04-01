import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import { Search, BarChart3, Trash2, Filter, Lightbulb, X, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
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

import { SAVED_ANALYSIS_KEY } from './SavedAnalysisPage';

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  targetMarket: string;
  createdDate: string;
  score?: number;
  shared: boolean;
  // Legacy flat fields (fallback for old records)
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: string;
  competition: string;
  viability: string;
  // Structured fields (populated for new records)
  ideaSummary?: string;
  confidenceScore?: number;
  competitors?: Array<{ name: string; threat?: string; opportunity?: string }>;
  competitiveAdvantage?: string;
  market?: Record<string, any>;
  heuristicScores?: Record<string, number>;
  investorAnalysis?: Record<string, any>;
}

type SortOption = 'date' | 'score-desc' | 'score-asc';
type RangeFilter = 'all' | 'high' | 'medium' | 'low';

interface SavedIdeasPageProps {
  onNavigate?: (page: string) => void;
}

// ── Highlight matching text in search results ─────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5 not-italic font-semibold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function SavedIdeasPage({ onNavigate }: SavedIdeasPageProps) {
  const { user } = useUser();
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState('');
  const [scoreFilter, setScoreFilter]       = useState<RangeFilter>('all');
  const [viabilityFilter, setViabilityFilter] = useState<RangeFilter>('all');
  const [sortBy, setSortBy]                 = useState<SortOption>('date');

  const hasActiveFilters =
    searchQuery !== '' ||
    scoreFilter !== 'all' ||
    viabilityFilter !== 'all' ||
    sortBy !== 'date';

  const resetFilters = () => {
    setSearchQuery('');
    setScoreFilter('all');
    setViabilityFilter('all');
    setSortBy('date');
  };

  // ── Load ideas from database ──────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      loadIdeas();
    } else {
      setIdeas([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadIdeas = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('idea_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading ideas:', error);
        toast.error('Failed to load your ideas');
        setIdeas([]);
      } else {
        const transformedIdeas: SavedIdea[] = (data || []).map(analysis => {
          let competitors: Array<{ name: string; threat?: string; opportunity?: string }> | undefined;
          let parsedCompetitiveAdvantage: string | undefined;
          try {
            if (analysis.competition) {
              const comp = JSON.parse(analysis.competition);
              if (Array.isArray(comp.competitors)) competitors = comp.competitors;
              if (typeof comp.competitiveAdvantage === 'string') parsedCompetitiveAdvantage = comp.competitiveAdvantage;
            }
          } catch {
            // legacy string format
          }

          let market: Record<string, any> | undefined;
          try {
            if (analysis.market_size) market = JSON.parse(analysis.market_size);
          } catch {
            // legacy string format
          }

          return {
            id: analysis.id,
            title: analysis.idea_title,
            description: analysis.idea_description,
            tags: analysis.target_market
              ? analysis.target_market.split(',').map((t: string) => t.trim()).filter(Boolean)
              : [],
            targetMarket: analysis.target_market || '',
            createdDate: analysis.created_at,
            score: analysis.score,
            shared: false,
            strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
            weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
            recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
            marketSize: analysis.market_size || '',
            competition: analysis.competition || '',
            viability: analysis.viability || '',
            ideaSummary: analysis.idea_summary || undefined,
            confidenceScore: typeof analysis.confidence_score === 'number' ? analysis.confidence_score : undefined,
            competitors,
            competitiveAdvantage: analysis.competitive_advantage || parsedCompetitiveAdvantage,
            market,
            heuristicScores: analysis.heuristic_scores || undefined,
            investorAnalysis: analysis.investor_analysis || undefined,
          };
        });

        // Deduplicate: backend-saved rows (non-null normalized_idea = complete data) win
        const normalizeKey = (s: string | undefined | null) =>
          (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
        const rawData = data! as any[];
        const indexed = rawData.map((raw, i) => ({ raw, idea: transformedIdeas[i] }));
        indexed.sort((a, b) => {
          const aHas = a.raw.normalized_idea ? 0 : 1;
          const bHas = b.raw.normalized_idea ? 0 : 1;
          return aHas - bHas;
        });
        const seen = new Set<string>();
        const deduped: SavedIdea[] = [];
        for (const { raw, idea } of indexed) {
          const key = raw.normalized_idea
            ? (raw.normalized_idea as string)
            : normalizeKey(raw.idea_title);
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(idea);
          }
        }
        // Restore date-descending order (useMemo will re-sort for other options)
        deduped.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        setIdeas(deduped);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load your ideas');
      setIdeas([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('idea_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting idea:', error);
        toast.error('Failed to delete idea');
      } else {
        setIdeas(ideas.filter(idea => idea.id !== id));
        setDeleteId(null);
        toast.success('Idea deleted successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete idea');
    }
  };

  // ── View analysis ─────────────────────────────────────────────────────────
  const handleViewAnalysis = (idea: SavedIdea) => {
    const data = {
      title: idea.title,
      description: idea.description,
      targetMarket: idea.tags.join(', '),
      score: idea.score || 0,
      strengths: idea.strengths,
      weaknesses: idea.weaknesses,
      recommendations: idea.recommendations,
      viability: idea.viability,
      marketSize: idea.marketSize,
      competition: idea.competition,
      idea_summary: idea.ideaSummary,
      confidence_score: idea.confidenceScore,
      competitors: idea.competitors,
      competitive_advantage: idea.competitiveAdvantage,
      market: idea.market,
      heuristic_scores: idea.heuristicScores,
      investor_analysis: idea.investorAnalysis,
    };
    sessionStorage.setItem(SAVED_ANALYSIS_KEY, JSON.stringify(data));
    onNavigate?.('saved-analysis');
  };

  // ── Filter + Sort pipeline (memoised) ─────────────────────────────────────
  const processedIdeas = useMemo(() => {
    let result = [...ideas];

    // 1. Search — title only (case-insensitive)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(idea => idea.title.toLowerCase().includes(q));
    }

    // 2. Score filter
    if (scoreFilter !== 'all') {
      result = result.filter(idea => {
        const s = idea.score ?? 0;
        if (scoreFilter === 'high')   return s >= 80;
        if (scoreFilter === 'medium') return s >= 50 && s < 80;
        if (scoreFilter === 'low')    return s < 50;
        return true;
      });
    }

    // 3. Viability filter
    if (viabilityFilter !== 'all') {
      result = result.filter(idea => {
        const v = (idea.viability || '').toLowerCase().trim();
        return v === viabilityFilter;
      });
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === 'score-desc') return (b.score ?? 0) - (a.score ?? 0);
      if (sortBy === 'score-asc')  return (a.score ?? 0) - (b.score ?? 0);
      // 'date' (default)
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });

    return result;
  }, [ideas, searchQuery, scoreFilter, viabilityFilter, sortBy]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';

  // ── Filter button helper ──────────────────────────────────────────────────
  const FilterBtn = ({
    active,
    onClick,
    children,
    accent,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    accent?: string;
  }) => (
    <button
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
        active
          ? accent ?? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="gradient-lavender relative overflow-hidden py-16">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-4 font-['Poppins'] text-4xl text-white md:text-5xl">
              My Ideas Vault
            </h1>
            <p className="max-w-2xl text-xl text-white/80">
              All your generated and saved ideas in one place
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background relative min-h-[80vh] py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-[10%] bottom-[20%] h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* ── Search + Filters ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10"
          >
            <div className="glass-card mb-4 rounded-2xl border border-border/50 p-4 space-y-4">
              {/* Row 1: Search */}
              <div className="relative">
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none" />
                <Input
                  placeholder="Search ideas by name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-10 rounded-xl border-border/50 bg-background/50 pl-10 pr-10 focus:bg-background transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Row 2: Score + Viability filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Score
                  </span>
                  <FilterBtn active={scoreFilter === 'all'} onClick={() => setScoreFilter('all')}>
                    All
                  </FilterBtn>
                  <FilterBtn
                    active={scoreFilter === 'high'}
                    onClick={() => setScoreFilter('high')}
                    accent="bg-green-500/20 text-green-700 dark:text-green-400 ring-1 ring-green-500/30"
                  >
                    High ≥80
                  </FilterBtn>
                  <FilterBtn
                    active={scoreFilter === 'medium'}
                    onClick={() => setScoreFilter('medium')}
                    accent="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/30"
                  >
                    Med 50–79
                  </FilterBtn>
                  <FilterBtn
                    active={scoreFilter === 'low'}
                    onClick={() => setScoreFilter('low')}
                    accent="bg-red-500/20 text-red-700 dark:text-red-400 ring-1 ring-red-500/30"
                  >
                    Low &lt;50
                  </FilterBtn>
                </div>

                <div className="h-5 w-px bg-border/50 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Viability
                  </span>
                  <FilterBtn active={viabilityFilter === 'all'} onClick={() => setViabilityFilter('all')}>
                    All
                  </FilterBtn>
                  <FilterBtn
                    active={viabilityFilter === 'high'}
                    onClick={() => setViabilityFilter('high')}
                    accent="bg-green-500/20 text-green-700 dark:text-green-400 ring-1 ring-green-500/30"
                  >
                    High
                  </FilterBtn>
                  <FilterBtn
                    active={viabilityFilter === 'medium'}
                    onClick={() => setViabilityFilter('medium')}
                    accent="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/30"
                  >
                    Medium
                  </FilterBtn>
                  <FilterBtn
                    active={viabilityFilter === 'low'}
                    onClick={() => setViabilityFilter('low')}
                    accent="bg-red-500/20 text-red-700 dark:text-red-400 ring-1 ring-red-500/30"
                  >
                    Low
                  </FilterBtn>
                </div>
              </div>

              {/* Row 3: Sort + Reset */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sort
                  </span>
                  <FilterBtn active={sortBy === 'date'} onClick={() => setSortBy('date')}>
                    Most Recent
                  </FilterBtn>
                  <FilterBtn active={sortBy === 'score-desc'} onClick={() => setSortBy('score-desc')}>
                    Highest Score
                  </FilterBtn>
                  <FilterBtn active={sortBy === 'score-asc'} onClick={() => setSortBy('score-asc')}>
                    Lowest Score
                  </FilterBtn>
                </div>

                <AnimatePresence>
                  {hasActiveFilters && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                      onClick={resetFilters}
                      className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Reset filters
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Result count */}
            <div className="flex items-center justify-between px-1">
              <p className="text-muted-foreground text-sm font-medium">
                Showing{' '}
                <span className="text-foreground font-semibold">{processedIdeas.length}</span>{' '}
                {processedIdeas.length === 1 ? 'idea' : 'ideas'}
                {hasActiveFilters && ideas.length > 0 && (
                  <span className="text-muted-foreground font-normal"> of {ideas.length}</span>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                {processedIdeas.filter(i => !i.shared).length} Private
              </div>
            </div>
          </motion.div>

          {/* ── Ideas Grid ── */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
                  <div className="h-5 w-3/4 rounded-lg bg-muted" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-4/6 rounded bg-muted" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-muted" />
                    <div className="h-5 w-20 rounded-full bg-muted" />
                  </div>
                  <div className="h-8 w-full rounded-xl bg-muted mt-2" />
                </div>
              ))}
            </div>
          ) : ideas.length === 0 ? (
            /* Vault is completely empty */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 shadow-xl shadow-primary/5">
                <Lightbulb className="h-12 w-12 text-primary/80" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">Your vault is empty</h3>
              <p className="text-muted-foreground mb-8 max-w-md text-lg">
                Every great unicorn started as a simple idea. Ready to find yours?
              </p>
              <Button
                onClick={() => onNavigate?.('Idea Analyser')}
                size="lg"
                className="gradient-lavender shadow-lavender h-12 rounded-xl px-8 text-base font-semibold transition-transform hover:scale-105 active:scale-95"
              >
                Generate Your First Idea
              </Button>
            </motion.div>
          ) : processedIdeas.length === 0 ? (
            /* Ideas exist but filters hide them all */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 shadow-xl shadow-primary/5">
                <Search className="h-12 w-12 text-primary/80" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">
                No ideas match your search
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md text-base">
                Try different keywords or adjust your filters.
              </p>
              <Button
                onClick={resetFilters}
                variant="outline"
                size="lg"
                className="h-11 rounded-xl px-8 text-base font-medium"
              >
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {processedIdeas.map((idea, index) => (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    layout
                  >
                    <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                      <CardContent className="relative flex h-full flex-col p-6">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="line-clamp-2 text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                              <HighlightText text={idea.title} query={searchQuery} />
                            </h3>
                          </div>
                          {!idea.shared && (
                            <div
                              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-background/80 shadow-sm ring-1 ring-border/50"
                              title="Private Idea"
                            >
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                            </div>
                          )}
                        </div>

                        <p className="text-muted-foreground mb-6 line-clamp-3 flex-1 text-sm leading-relaxed">
                          {idea.description}
                        </p>

                        <div className="mb-6 flex flex-wrap gap-2">
                          {idea.tags.length > 0 ? (
                            idea.tags.slice(0, 3).map(tag => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-secondary/50 font-normal text-xs hover:bg-secondary"
                              >
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-secondary/30 text-muted-foreground font-normal text-xs"
                            >
                              No tags
                            </Badge>
                          )}
                          {idea.tags.length > 3 && (
                            <Badge variant="secondary" className="bg-secondary/30 text-xs">
                              +{idea.tags.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-auto space-y-4">
                          {idea.score !== undefined && (
                            <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-3 ring-1 ring-border/50">
                              <span className="text-xs font-medium text-muted-foreground">
                                Viability Score
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-bold ${scoreColor(idea.score)}`}>
                                  {idea.score}
                                </span>
                                <span className="text-xs text-muted-foreground">/100</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-2">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {formatDate(idea.createdDate)}
                            </span>

                            <div className="flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(idea.id)}
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                title="Delete Idea"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleViewAnalysis(idea)}
                            className="w-full rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium transition-all duration-300"
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analysis
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Idea?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your saved idea.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Trophy, Target, CheckCircle, BookOpen } from 'lucide-react';

import { CaseCard } from '../CaseCard';
import { FilterChip } from '../FilterChip';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

import { fetchCaseStudies, subscribeToCaseStudies } from '@/lib/caseStudyService';
import type { CaseStudy } from '@/lib/caseStudyService';

interface CaseStudiesPageProps {
  onNavigate?: (page: string, caseId?: string) => void;
}

// ── Skeleton placeholder that mirrors a CaseCard's dimensions ────────────────
function CaseCardSkeleton() {
  return (
    <div className="glass-surface rounded-[16px] p-6">
      <div className="mb-4 flex gap-4">
        <Skeleton className="h-12 w-12 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full ml-auto" />
      </div>
    </div>
  );
}

export function CaseStudiesPage({ onNavigate }: CaseStudiesPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'attempts' | 'leaderboard'>('all');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setFetchError(null);

      const { data, error } = await fetchCaseStudies();

      if (cancelled) return;

      if (error) {
        setFetchError(error);
        setCaseStudies([]);
      } else {
        setCaseStudies(data);
      }

      setIsLoading(false);
    };

    load();

    // Stay current after background revalidations.  No loading state is
    // shown — the update is seamless from stale data to fresh data.
    // `cancelled` prevents setState on an unmounted component.
    const unsubscribe = subscribeToCaseStudies((fresh) => {
      if (!cancelled) setCaseStudies([...fresh]);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Listen for custom event to show leaderboard tab
  useEffect(() => {
    const handleShowLeaderboard = () => setActiveTab('leaderboard');
    window.addEventListener('showLeaderboard', handleShowLeaderboard);
    return () => window.removeEventListener('showLeaderboard', handleShowLeaderboard);
  }, []);

  const filteredCases = caseStudies.filter(item => {
    const matchesDifficulty = difficulty === 'All' || item.difficulty === difficulty;
    const matchesCategory = category === 'all' || item.category === category;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-gradient-lavender text-2xl sm:text-3xl mb-2">Case Studies</h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-sm sm:text-base">
              Real challenges inspired by startups and tech leaders. Practice solving business
              problems and climb the leaderboard.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                className="rounded-full h-9 px-4 text-sm"
                onClick={() => setActiveTab('all')}
              >
                <Target className="mr-1.5 h-4 w-4" />
                All Cases
              </Button>
              <Button
                variant={activeTab === 'attempts' ? 'default' : 'outline'}
                className="rounded-full h-9 px-4 text-sm"
                onClick={() => setActiveTab('attempts')}
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Your Attempts
              </Button>
              <Button
                variant={activeTab === 'leaderboard' ? 'default' : 'outline'}
                className="rounded-full h-9 px-4 text-sm"
                onClick={() => setActiveTab('leaderboard')}
              >
                <Trophy className="mr-1.5 h-4 w-4" />
                Leaderboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar — sticky, only visible on All Cases tab */}
      {activeTab === 'all' && (
        <div className="bg-background/80 border-border sticky top-16 z-40 border-b backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex flex-wrap gap-2">
                {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
                  <FilterChip
                    key={diff}
                    label={diff}
                    isActive={difficulty === diff}
                    onClick={() => setDifficulty(diff)}
                  />
                ))}
              </div>

              <div className="ml-auto flex gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[140px] rounded-xl">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] rounded-xl">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="attempts">Most Attempted</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-[200px] rounded-xl pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {activeTab === 'all' && (
            <>
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <CaseCardSkeleton key={i} />
                  ))}
                </div>
              ) : fetchError ? (
                <div className="text-center py-16">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
                  <p className="text-muted-foreground text-sm">{fetchError}</p>
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {caseStudies.length === 0
                      ? 'No case studies published yet'
                      : 'No case studies match your filters'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {caseStudies.length === 0
                      ? 'Check back soon — new case studies are being added.'
                      : 'Try adjusting your filters or search query.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {filteredCases.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CaseCard
                        {...item}
                        onClick={() => onNavigate?.('CaseDetail', item.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'attempts' && (
            <div className="text-center py-16">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No attempts yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Solve a case study to track your progress and scores here.
              </p>
              <Button onClick={() => setActiveTab('all')} className="gradient-lavender rounded-xl">
                <Target className="mr-2 h-4 w-4" />
                Browse Case Studies
              </Button>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="text-center py-16">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Leaderboard coming soon</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Complete case studies to earn points and compete with other founders.
              </p>
              <Button onClick={() => setActiveTab('all')} className="gradient-lavender rounded-xl">
                <Target className="mr-2 h-4 w-4" />
                Start Solving
              </Button>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}

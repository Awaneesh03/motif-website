import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Trophy, Target, CheckCircle, Loader2, BookOpen } from 'lucide-react';

import { CaseCard, CaseCardProps } from '../CaseCard';
import { FilterChip } from '../FilterChip';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';

import { supabase } from '@/lib/supabase';

interface CaseStudiesPageProps {
  onNavigate?: (page: string, caseId?: string) => void;
}

export function CaseStudiesPage({ onNavigate }: CaseStudiesPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'attempts' | 'leaderboard'>('all');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [caseStudies, setCaseStudies] = useState<CaseCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch case studies from Supabase — real data only, no fallback to mock
  useEffect(() => {
    const fetchCaseStudies = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase
          .from('case_studies')
          .select('*')
          .eq('status', 'Published')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching case studies:', error);
          setFetchError('Failed to load case studies. Please try again.');
          setCaseStudies([]);
        } else {
          const transformedData: CaseCardProps[] = (data ?? []).map((item: any) => ({
            id: item.id,
            company: item.company || 'Case Study',
            logo: item.image_url || undefined,
            title: item.title,
            description: item.problem_statement || '',
            difficulty: mapDifficulty(item.difficulty),
            category: item.category || (item.tags?.[0] || 'General'),
            attempts: item.attempts || 0,
          }));
          setCaseStudies(transformedData);
        }
      } catch (err) {
        console.error('Error:', err);
        setFetchError('Failed to load case studies. Please try again.');
        setCaseStudies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseStudies();
  }, []);

  // Map database difficulty to CaseCard difficulty
  const mapDifficulty = (dbDifficulty: string): 'Easy' | 'Medium' | 'Hard' => {
    switch (dbDifficulty) {
      case 'Beginner': return 'Easy';
      case 'Intermediate': return 'Medium';
      case 'Advanced': return 'Hard';
      default: return 'Medium';
    }
  };

  // Listen for custom event to show leaderboard
  useEffect(() => {
    const handleShowLeaderboard = () => setActiveTab('leaderboard');
    window.addEventListener('showLeaderboard', handleShowLeaderboard);
    return () => window.removeEventListener('showLeaderboard', handleShowLeaderboard);
  }, []);

  const filteredCases = caseStudies.filter(caseItem => {
    const matchesDifficulty = difficulty === 'All' || caseItem.difficulty === difficulty;
    const matchesCategory = category === 'all' || caseItem.category === category;
    const matchesSearch =
      caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
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

      {/* Filter Bar - Sticky - Only show for All Cases tab */}
      {activeTab === 'all' && (
        <div className="bg-background/80 border-border sticky top-16 z-40 border-b backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row">
              {/* Difficulty Chips */}
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

              {/* Category & Sort */}
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

                {/* Search */}
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

      {/* Content Area */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* All Cases Tab */}
          {activeTab === 'all' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading case studies...</span>
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
                    {caseStudies.length === 0 ? 'No case studies published yet' : 'No case studies match your filters'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {caseStudies.length === 0
                      ? 'Check back soon — new case studies are being added.'
                      : 'Try adjusting your filters or search query.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {filteredCases.map((caseItem, index) => (
                    <motion.div
                      key={caseItem.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CaseCard {...caseItem} onClick={() => onNavigate?.('CaseDetail', caseItem.id)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Your Attempts Tab */}
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

          {/* Leaderboard Tab */}
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

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Trophy, Target, Clock, CheckCircle, Star, TrendingUp, Loader2 } from 'lucide-react';

import { StarRating } from '../ui/star-rating';

import { CaseCard, CaseCardProps } from '../CaseCard';
import { FilterChip } from '../FilterChip';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { supabase } from '@/lib/supabase';

const mockCases: CaseCardProps[] = [
  {
    id: '1',
    company: 'TechFlow',
    logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop',
    title: 'Scaling User Acquisition on a Limited Budget',
    description:
      'A B2B SaaS startup needs to grow from 100 to 1000 users in 3 months with only $5k marketing budget.',
    difficulty: 'Medium',
    category: 'Marketing',
    attempts: 234,
  },
  {
    id: '2',
    company: 'GrowthStack',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    title: 'Product-Market Fit Crisis',
    description:
      'An AI tool with great tech but no clear use case. Help find the right market segment.',
    difficulty: 'Hard',
    category: 'Product',
    attempts: 189,
  },
  {
    id: '3',
    company: 'MealPal',
    logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop',
    title: 'Optimizing Food Delivery Operations',
    description: 'Reduce delivery time by 30% while maintaining quality and keeping costs low.',
    difficulty: 'Medium',
    category: 'Operations',
    attempts: 156,
  },
  {
    id: '4',
    company: 'StartupHub',
    logo: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=100&h=100&fit=crop',
    title: 'Building a Community from Zero',
    description: 'Launch a founder community and get to 500 active members in the first month.',
    difficulty: 'Easy',
    category: 'Growth',
    attempts: 312,
  },
  {
    id: '5',
    company: 'DataViz Pro',
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop',
    title: 'Pivot Strategy for Failing Product',
    description: 'A data visualization tool is losing users. Decide whether to pivot or persevere.',
    difficulty: 'Hard',
    category: 'Product',
    attempts: 98,
  },
  {
    id: '6',
    company: 'FitTrack',
    logo: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop',
    title: 'Viral Marketing Campaign Design',
    description: 'Create a growth loop that turns every user into 3 new users organically.',
    difficulty: 'Medium',
    category: 'Marketing',
    attempts: 267,
  },
  {
    id: '7',
    company: 'CodeLearn',
    logo: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=100&h=100&fit=crop',
    title: 'Pricing Model Optimization',
    description: 'Find the optimal pricing tiers that maximize revenue without losing customers.',
    difficulty: 'Easy',
    category: 'Growth',
    attempts: 445,
  },
  {
    id: '8',
    company: 'CloudSync',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop',
    title: 'Enterprise Sales Strategy',
    description:
      "Break into enterprise market with a product built for SMBs. What's your approach?",
    difficulty: 'Hard',
    category: 'Growth',
    attempts: 123,
  },
];

// Mock data for user attempts
const mockUserAttempts = [
  {
    id: '1',
    caseId: '1',
    company: 'TechFlow',
    title: 'Scaling User Acquisition on a Limited Budget',
    difficulty: 'Medium',
    score: 85,
    status: 'completed',
    submittedAt: '2 days ago',
    timeSpent: '45 min',
    userRating: 4,
  },
  {
    id: '2',
    caseId: '4',
    company: 'StartupHub',
    title: 'Building a Community from Zero',
    difficulty: 'Easy',
    score: 92,
    status: 'completed',
    submittedAt: '5 days ago',
    timeSpent: '30 min',
    userRating: 5,
  },
  {
    id: '3',
    caseId: '6',
    company: 'FitTrack',
    title: 'Viral Marketing Campaign Design',
    difficulty: 'Medium',
    score: 78,
    status: 'completed',
    submittedAt: '1 week ago',
    timeSpent: '52 min',
    userRating: 3,
  },
  {
    id: '4',
    caseId: '2',
    company: 'GrowthStack',
    title: 'Product-Market Fit Crisis',
    difficulty: 'Hard',
    score: 0,
    status: 'in-progress',
    submittedAt: 'In Progress',
    timeSpent: '15 min',
    userRating: 0,
  },
];

// Mock leaderboard data
const mockLeaderboard = [
  { rank: 1, name: 'Alex Johnson', avatar: 'AJ', score: 2847, casesCompleted: 24, avgScore: 89 },
  { rank: 2, name: 'Sarah Chen', avatar: 'SC', score: 2654, casesCompleted: 22, avgScore: 91 },
  { rank: 3, name: 'Michael Park', avatar: 'MP', score: 2431, casesCompleted: 21, avgScore: 87 },
  { rank: 4, name: 'Emily Davis', avatar: 'ED', score: 2298, casesCompleted: 20, avgScore: 86 },
  { rank: 5, name: 'David Kim', avatar: 'DK', score: 2187, casesCompleted: 19, avgScore: 88 },
  { rank: 6, name: 'Jessica Wang', avatar: 'JW', score: 2043, casesCompleted: 18, avgScore: 85 },
  { rank: 7, name: 'Ryan Martinez', avatar: 'RM', score: 1987, casesCompleted: 17, avgScore: 84 },
  { rank: 8, name: 'Lisa Anderson', avatar: 'LA', score: 1876, casesCompleted: 16, avgScore: 83 },
  { rank: 9, name: 'Chris Taylor', avatar: 'CT', score: 1765, casesCompleted: 15, avgScore: 82 },
  { rank: 10, name: 'Amanda White', avatar: 'AW', score: 1654, casesCompleted: 14, avgScore: 81 },
];

interface CaseStudiesPageProps {
  onNavigate?: (page: string, caseId?: string) => void;
}

export function CaseStudiesPage({ onNavigate }: CaseStudiesPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'attempts' | 'leaderboard'>('all');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');  
  const [userAttempts, setUserAttempts] = useState(mockUserAttempts);
  const [caseStudies, setCaseStudies] = useState<CaseCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch case studies from Supabase
  useEffect(() => {
    const fetchCaseStudies = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('case_studies')
          .select('*')
          .eq('status', 'Published')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching case studies:', error);
          // Fall back to mock data if fetch fails
          setCaseStudies(mockCases);
        } else if (data && data.length > 0) {
          // Transform DB data to CaseCardProps format
          const transformedData: CaseCardProps[] = data.map((item: any) => ({
            id: item.id,
            company: item.company || 'Case Study',
            logo: item.image_url || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
            title: item.title,
            description: item.problem_statement || '',
            difficulty: mapDifficulty(item.difficulty),
            category: item.category || (item.tags?.[0] || 'General'),
            attempts: item.attempts || 0,
          }));
          setCaseStudies(transformedData);
        } else {
          // No published case studies, show mock data as examples
          setCaseStudies(mockCases);
        }
      } catch (err) {
        console.error('Error:', err);
        setCaseStudies(mockCases);
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

  // Function to handle rating changes
  const handleRatingChange = (attemptId: string, newRating: number) => {
    setUserAttempts(prev => 
      prev.map(attempt => 
        attempt.id === attemptId 
          ? { ...attempt, userRating: newRating }
          : attempt
      )
    );
  };

  // Listen for custom event to show leaderboard
  useEffect(() => {
    const handleShowLeaderboard = () => {
      setActiveTab('leaderboard');
    };

    window.addEventListener('showLeaderboard', handleShowLeaderboard);

    return () => {
      window.removeEventListener('showLeaderboard', handleShowLeaderboard);
    };
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

      {/* Content Area - Conditional Rendering */}
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
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No case studies found</h3>
                  <p className="text-muted-foreground">Check back later for new case studies!</p>
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
            <div className="space-y-5">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">Total Attempts</p>
                        <p className="text-xl sm:text-2xl font-bold">{mockUserAttempts.length}</p>
                      </div>
                      <Target className="text-primary h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">Completed</p>
                        <p className="text-xl sm:text-2xl font-bold">
                          {mockUserAttempts.filter(a => a.status === 'completed').length}
                        </p>
                      </div>
                      <CheckCircle className="text-green-500 h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">Average Score</p>
                        <p className="text-xl sm:text-2xl font-bold">
                          {Math.round(
                            mockUserAttempts
                              .filter(a => a.status === 'completed')
                              .reduce((acc, a) => acc + a.score, 0) /
                            mockUserAttempts.filter(a => a.status === 'completed').length
                          )}
                          %
                        </p>
                      </div>
                      <TrendingUp className="text-blue-500 h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">Total Time</p>
                        <p className="text-xl sm:text-2xl font-bold">2h 22m</p>
                      </div>
                      <Clock className="text-purple-500 h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attempts List */}
              <div className="space-y-3">
                {userAttempts.map((attempt, index) => (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <h3 className="text-sm sm:text-base font-semibold truncate">{attempt.title}</h3>
                              <Badge
                                variant={
                                  attempt.difficulty === 'Easy'
                                    ? 'secondary'
                                    : attempt.difficulty === 'Medium'
                                      ? 'default'
                                      : 'destructive'
                                }
                                className="rounded-full text-xs"
                              >
                                {attempt.difficulty}
                              </Badge>
                              {attempt.status === 'completed' ? (
                                <Badge className="rounded-full text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                  Completed
                                </Badge>
                              ) : (
                                <Badge className="rounded-full text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-xs sm:text-sm mb-2">{attempt.company}</p>
                            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{attempt.timeSpent}</span>
                              </div>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline">{attempt.submittedAt}</span>
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                            {attempt.status === 'completed' && (
                              <>
                                <div>
                                  <div className="text-2xl sm:text-2xl font-bold text-primary">{attempt.score}%</div>
                                  <div className="text-xs text-muted-foreground">AI Score</div>
                                </div>

                                {/* Interactive Star Rating */}
                                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 sm:mt-2">
                                  <span className="text-xs text-muted-foreground hidden sm:block">Rate:</span>
                                  <StarRating
                                    rating={attempt.userRating}
                                    onRatingChange={(rating) => handleRatingChange(attempt.id, rating)}
                                    size="sm"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              {/* Compact Header Banner */}
              <div className="gradient-lavender rounded-xl px-4 py-3 flex items-center gap-2.5">
                <span className="text-xl">🏆</span>
                <div>
                  <h2 className="text-white font-semibold text-base">Top Performers</h2>
                  <p className="text-white/70 text-xs">Compete with the best in startup strategy</p>
                </div>
              </div>

              {/* Your Rank - Highlighted personal card */}
              <div className="relative bg-gradient-to-r from-primary/15 via-primary/10 to-transparent rounded-xl p-4 ring-2 ring-primary/40 shadow-md">
                {/* "You" badge */}
                <div className="absolute -top-2 left-4 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  You
                </div>

                <div className="flex items-center gap-4 mt-1">
                  {/* Large rank badge */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-lg shadow-lg shrink-0 ring-4 ring-primary/20">
                    #42
                  </div>

                  {/* Info section */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base text-foreground">Your Current Rank</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">8 cases completed</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        85% avg
                      </span>
                    </div>
                  </div>

                  {/* Points - prominent */}
                  <div className="text-right shrink-0 bg-primary/10 rounded-lg px-3 py-2">
                    <p className="text-2xl font-bold text-primary">1,234</p>
                    <p className="text-xs text-muted-foreground">total points</p>
                  </div>
                </div>
              </div>

              {/* Global Leaderboard */}
              <Card className="border-border/50">
                <CardHeader className="px-3 py-2.5 pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">
                    Global Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2 pt-0">
                  <div className="divide-y divide-border/30">
                    {mockLeaderboard.map((user, index) => (
                      <motion.div
                        key={user.rank}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex items-center gap-2.5 py-2 px-2 rounded-md transition-colors hover:bg-muted/40 ${
                          user.rank <= 3 ? 'bg-muted/20' : ''
                        }`}
                      >
                        {/* Rank indicator */}
                        <div className={`w-7 text-center shrink-0 ${
                          user.rank === 1 ? 'text-yellow-500' :
                          user.rank === 2 ? 'text-gray-400' :
                          user.rank === 3 ? 'text-orange-500' :
                          'text-muted-foreground'
                        }`}>
                          {user.rank <= 3 ? (
                            <span className="text-lg">{user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}</span>
                          ) : (
                            <span className="text-xs font-medium">#{user.rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="bg-muted text-xs font-medium">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name + cases inline */}
                        <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                          <p className={`text-sm truncate ${user.rank <= 3 ? 'font-semibold' : 'font-medium'}`}>
                            {user.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
                            {user.casesCompleted} cases
                          </span>
                        </div>

                        {/* Avg score - tablet+ */}
                        <div className="hidden md:flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{user.avgScore}%</span>
                        </div>

                        {/* Points - always visible */}
                        <div className="text-right shrink-0 w-14">
                          <span className={`text-sm font-bold ${user.rank <= 3 ? 'text-primary' : ''}`}>
                            {user.score.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-0.5">pts</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Trophy, Target, Clock, CheckCircle, Star, TrendingUp } from 'lucide-react';

import { CaseCard, CaseCardProps } from '../CaseCard';
import { FilterChip } from '../FilterChip';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';

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

  const filteredCases = mockCases.filter(caseItem => {
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
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-gradient-lavender mb-4">Case Studies</h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Real challenges inspired by startups and tech leaders. Practice solving business
              problems and climb the leaderboard.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setActiveTab('all')}
              >
                <Target className="mr-2 h-4 w-4" />
                All Cases
              </Button>
              <Button
                variant={activeTab === 'attempts' ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setActiveTab('attempts')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Your Attempts
              </Button>
              <Button
                variant={activeTab === 'leaderboard' ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setActiveTab('leaderboard')}
              >
                <Trophy className="mr-2 h-4 w-4" />
                Leaderboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar - Sticky - Only show for All Cases tab */}
      {activeTab === 'all' && (
        <div className="bg-background/80 border-border sticky top-16 z-40 border-b backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
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
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* All Cases Tab */}
          {activeTab === 'all' && (
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

          {/* Your Attempts Tab */}
          {activeTab === 'attempts' && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Total Attempts</p>
                        <p className="text-2xl font-bold">{mockUserAttempts.length}</p>
                      </div>
                      <Target className="text-primary h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Completed</p>
                        <p className="text-2xl font-bold">
                          {mockUserAttempts.filter(a => a.status === 'completed').length}
                        </p>
                      </div>
                      <CheckCircle className="text-green-500 h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Average Score</p>
                        <p className="text-2xl font-bold">
                          {Math.round(
                            mockUserAttempts
                              .filter(a => a.status === 'completed')
                              .reduce((acc, a) => acc + a.score, 0) /
                              mockUserAttempts.filter(a => a.status === 'completed').length
                          )}
                          %
                        </p>
                      </div>
                      <TrendingUp className="text-blue-500 h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Total Time</p>
                        <p className="text-2xl font-bold">2h 22m</p>
                      </div>
                      <Clock className="text-purple-500 h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attempts List */}
              <div className="space-y-4">
                {mockUserAttempts.map((attempt, index) => (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{attempt.title}</h3>
                              <Badge
                                variant={
                                  attempt.difficulty === 'Easy'
                                    ? 'secondary'
                                    : attempt.difficulty === 'Medium'
                                      ? 'default'
                                      : 'destructive'
                                }
                                className="rounded-full"
                              >
                                {attempt.difficulty}
                              </Badge>
                              {attempt.status === 'completed' ? (
                                <Badge className="rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                  Completed
                                </Badge>
                              ) : (
                                <Badge className="rounded-full bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm mb-3">{attempt.company}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{attempt.timeSpent}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Submitted {attempt.submittedAt}</span>
                              </div>
                            </div>
                          </div>
                          {attempt.status === 'completed' && (
                            <div className="text-right">
                              <div className="text-3xl font-bold text-primary">{attempt.score}%</div>
                              <div className="text-sm text-muted-foreground">Score</div>
                              <div className="mt-2 flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= Math.round(attempt.score / 20)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
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
            <div className="space-y-6">
              {/* Leaderboard Header */}
              <Card className="gradient-lavender border-none text-white">
                <CardContent className="p-8 text-center">
                  <Trophy className="mx-auto mb-4 h-16 w-16" />
                  <h2 className="text-3xl font-bold mb-2">Top Performers</h2>
                  <p className="text-white/90">
                    Compete with the best minds in startup strategy and problem-solving
                  </p>
                </CardContent>
              </Card>

              {/* Leaderboard Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="text-primary h-5 w-5" />
                    Global Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockLeaderboard.map((user, index) => (
                      <motion.div
                        key={user.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:bg-muted/50 ${
                          user.rank <= 3 ? 'bg-muted/30' : ''
                        }`}
                      >
                        {/* Rank Badge */}
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                            user.rank === 1
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                              : user.rank === 2
                                ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                                : user.rank === 3
                                  ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.rank <= 3 ? (
                            <Trophy className="h-5 w-5" />
                          ) : (
                            <span>{user.rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-semibold">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{user.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {user.casesCompleted} cases completed
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{user.score}</div>
                          <div className="text-xs text-muted-foreground">Total Points</div>
                        </div>

                        {/* Average Score */}
                        <div className="text-right min-w-[80px]">
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-lg font-semibold">{user.avgScore}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Score</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Your Rank Card */}
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                        42
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Your Rank</p>
                        <p className="text-muted-foreground text-sm">Keep solving to climb higher!</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">1,234</div>
                      <div className="text-sm text-muted-foreground">Points</div>
                    </div>
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

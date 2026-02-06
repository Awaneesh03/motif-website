import { motion } from 'motion/react';
import { Trophy, Medal, Award, TrendingUp, Target, BarChart3, User } from 'lucide-react';

import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  casesCompleted: number;
  avgScore: number;
  badges: string[];
  trend?: 'up' | 'down' | 'same';
}

// Current user's stats (would come from auth context in real app)
const currentUserStats = {
  rank: 42,
  name: 'You',
  points: 486,
  casesCompleted: 3,
  avgScore: 78,
};

const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Alex Kim',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    points: 2847,
    casesCompleted: 12,
    avgScore: 94,
    badges: ['Top Contributor', 'Perfect Score'],
    trend: 'up',
  },
  {
    rank: 2,
    name: 'Jordan Lee',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    points: 2156,
    casesCompleted: 8,
    avgScore: 91,
    badges: ['Rising Star'],
    trend: 'same',
  },
  {
    rank: 3,
    name: 'Sam Patel',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    points: 1923,
    casesCompleted: 15,
    avgScore: 88,
    badges: ['Most Cases', 'Consistent'],
    trend: 'up',
  },
  {
    rank: 4,
    name: 'Maya Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    points: 1654,
    casesCompleted: 7,
    avgScore: 92,
    badges: ['High Scorer'],
    trend: 'down',
  },
  {
    rank: 5,
    name: 'Chen Wei',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    points: 1432,
    casesCompleted: 9,
    avgScore: 86,
    badges: ['Fast Solver'],
    trend: 'up',
  },
  {
    rank: 6,
    name: 'Emily Davis',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    points: 1298,
    casesCompleted: 6,
    avgScore: 89,
    badges: ['Quality Focus'],
  },
  {
    rank: 7,
    name: 'David Chen',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    points: 1157,
    casesCompleted: 10,
    avgScore: 84,
    badges: ['Dedicated'],
  },
  {
    rank: 8,
    name: 'Sarah Miller',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    points: 1089,
    casesCompleted: 5,
    avgScore: 90,
    badges: ['Newcomer'],
    trend: 'up',
  },
  {
    rank: 9,
    name: 'Michael Brown',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
    points: 967,
    casesCompleted: 8,
    avgScore: 82,
    badges: ['Steady'],
  },
  {
    rank: 10,
    name: 'Lisa Wang',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    points: 845,
    casesCompleted: 4,
    avgScore: 88,
    badges: ['Rising'],
    trend: 'up',
  },
];

interface LeaderboardPageProps {
  onNavigate?: (page: string) => void;
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />;
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600';
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/30 text-gray-500';
    if (rank === 3) return 'bg-orange-500/10 border-orange-500/30 text-orange-600';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Compact Header */}
      <section className="border-b border-border/50 bg-gradient-to-r from-[#C9A7EB]/15 via-background to-[#B084E8]/15 py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold md:text-2xl">Global Leaderboard</h1>
              <p className="text-sm text-muted-foreground">Top performers solving real business challenges</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          YOUR RANK SECTION - CRITICAL: Must be impossible to miss
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 py-4">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Left: Your Rank Label + Number */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-primary/30 bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">Your Current Rank</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">#{currentUserStats.rank}</span>
                  <span className="text-lg font-semibold text-foreground">{currentUserStats.points} pts</span>
                </div>
              </div>
            </div>

            {/* Right: Stats Row */}
            <div className="flex items-center gap-6 rounded-lg border border-border/50 bg-background/80 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cases</p>
                  <p className="text-sm font-semibold">{currentUserStats.casesCompleted}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                  <p className="text-sm font-semibold">{currentUserStats.avgScore}%</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <Button
                size="sm"
                onClick={() => onNavigate?.('case-studies')}
                className="hidden sm:inline-flex gradient-lavender text-white rounded-lg h-8 px-3 text-xs"
              >
                Improve Rank
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          {/* ═══════════════════════════════════════════════════════════════════
              TOP 3 PERFORMERS - Compact horizontal bar, not podium cards
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top Performers</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {mockLeaderboard.slice(0, 3).map((entry) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: entry.rank * 0.1 }}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${getRankStyle(entry.rank)}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar className="h-9 w-9 border-2 border-background">
                    <AvatarImage src={entry.avatar} alt={entry.name} />
                    <AvatarFallback className="text-xs">{entry.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{entry.name}</p>
                    <p className="text-xs opacity-80">{entry.casesCompleted} cases</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{entry.points}</p>
                    <p className="text-xs opacity-70">pts</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              GLOBAL RANKINGS - Dense, competitive table
              ═══════════════════════════════════════════════════════════════════ */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Global Rankings</h2>
            <Card className="border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="w-14 py-2.5 pl-4 pr-2 text-left font-medium">Rank</th>
                      <th className="py-2.5 px-2 text-left font-medium">User</th>
                      <th className="hidden py-2.5 px-2 text-center font-medium sm:table-cell">Cases</th>
                      <th className="hidden py-2.5 px-2 text-center font-medium md:table-cell">Avg</th>
                      <th className="py-2.5 px-2 pr-4 text-right font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLeaderboard.map((entry, index) => (
                      <motion.tr
                        key={entry.rank}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${
                          entry.rank <= 3 ? 'bg-muted/10' : ''
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-2">
                          <div className="flex items-center gap-1.5">
                            {entry.rank <= 3 ? (
                              getRankIcon(entry.rank)
                            ) : (
                              <span className="w-5 text-center text-muted-foreground">{entry.rank}</span>
                            )}
                            {entry.trend === 'up' && (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            )}
                            {entry.trend === 'down' && (
                              <TrendingUp className="h-3 w-3 rotate-180 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={entry.avatar} alt={entry.name} />
                              <AvatarFallback className="text-xs">{entry.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{entry.name}</span>
                            {entry.badges.length > 0 && (
                              <Badge variant="secondary" className="hidden text-[10px] px-1.5 py-0 h-4 lg:inline-flex">
                                {entry.badges[0]}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="hidden py-2.5 px-2 text-center text-muted-foreground sm:table-cell">
                          {entry.casesCompleted}
                        </td>
                        <td className="hidden py-2.5 px-2 text-center md:table-cell">
                          <span className={entry.avgScore >= 90 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                            {entry.avgScore}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 pr-4 text-right">
                          <span className="font-semibold text-primary">{entry.points.toLocaleString()}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* CTA */}
            <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-border/50 bg-muted/20 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Complete more case studies to climb the rankings
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate?.('case-studies')}
                className="rounded-lg h-8"
              >
                <Award className="mr-1.5 h-3.5 w-3.5" />
                Browse Cases
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { motion } from 'motion/react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

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
    if (rank === 1) return <Trophy className="h-8 w-8 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-8 w-8 text-gray-400" />;
    if (rank === 3) return <Medal className="h-8 w-8 text-orange-600" />;
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
    if (rank === 3) return 'bg-orange-600/20 text-orange-600 border-orange-600/30';
    return 'bg-primary/20 text-primary border-primary/30';
  };

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
            <div className="mb-4 flex items-center gap-3">
              <Trophy className="h-12 w-12 text-yellow-300" />
              <h1 className="font-['Poppins'] text-4xl text-white md:text-5xl">
                Global Leaderboard
              </h1>
            </div>
            <p className="max-w-2xl text-xl text-white/80">
              Top performers solving real business challenges
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Top 3 Podium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {mockLeaderboard.slice(0, 3).map((entry) => (
              <Card
                key={entry.rank}
                className={`border-border/50 shadow-xl ${
                  entry.rank === 1
                    ? 'md:z-10 md:order-2 md:scale-110'
                    : entry.rank === 2
                      ? 'md:order-1'
                      : 'md:order-3'
                }`}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">{getRankIcon(entry.rank)}</div>
                  <Avatar className="border-primary/20 mx-auto mb-4 h-24 w-24 border-4">
                    <AvatarImage src={entry.avatar} alt={entry.name} />
                    <AvatarFallback>{entry.name[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="mb-2">{entry.name}</h3>
                  <p className="text-primary mb-3 text-3xl">{entry.points}</p>
                  <p className="text-muted-foreground mb-2 text-sm">
                    {entry.casesCompleted} cases • {entry.avgScore}% avg
                  </p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {entry.badges.map(badge => (
                      <Badge key={badge} variant="secondary" className="rounded-full text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Full Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-border border-b">
                      <tr className="text-muted-foreground text-left text-sm">
                        <th className="w-16 p-4">Rank</th>
                        <th className="p-4">User</th>
                        <th className="hidden p-4 text-center md:table-cell">Cases</th>
                        <th className="hidden p-4 text-center lg:table-cell">Avg Score</th>
                        <th className="p-4 text-right">Points</th>
                        <th className="hidden w-16 p-4 text-center sm:table-cell">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockLeaderboard.map((entry, index) => (
                        <motion.tr
                          key={entry.rank}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-border/50 hover:bg-muted/50 border-b transition-colors"
                        >
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={`rounded-full ${getRankBadgeColor(entry.rank)}`}
                            >
                              #{entry.rank}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={entry.avatar} alt={entry.name} />
                                <AvatarFallback>{entry.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{entry.name}</p>
                                <div className="mt-1 flex gap-1">
                                  {entry.badges.slice(0, 2).map(badge => (
                                    <Badge
                                      key={badge}
                                      variant="secondary"
                                      className="rounded-full text-xs"
                                    >
                                      {badge}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden p-4 text-center md:table-cell">
                            {entry.casesCompleted}
                          </td>
                          <td className="hidden p-4 text-center lg:table-cell">
                            <Badge variant="outline" className="rounded-full">
                              {entry.avgScore}%
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-primary">{entry.points}</span>
                          </td>
                          <td className="hidden p-4 text-center sm:table-cell">
                            {entry.trend === 'up' && (
                              <TrendingUp className="mx-auto h-4 w-4 text-green-500" />
                            )}
                            {entry.trend === 'down' && (
                              <TrendingUp className="mx-auto h-4 w-4 rotate-180 text-red-500" />
                            )}
                            {entry.trend === 'same' && (
                              <div className="bg-muted-foreground mx-auto h-0.5 w-4" />
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground mb-4 text-sm">
                Want to climb the leaderboard? Complete more case studies!
              </p>
              <Button
                onClick={() => onNavigate?.('case-studies')}
                className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
              >
                <Award className="mr-2 h-4 w-4" />
                Browse Case Studies
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

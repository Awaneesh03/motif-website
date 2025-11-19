import { Trophy, Medal, Award } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  attempts: number;
}

const mockData: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100&h=100&fit=crop',
    score: 98,
    attempts: 12,
  },
  {
    rank: 2,
    name: 'Marcus Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    score: 95,
    attempts: 15,
  },
  {
    rank: 3,
    name: 'Elena Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    score: 92,
    attempts: 10,
  },
  {
    rank: 4,
    name: 'Alex Kim',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    score: 89,
    attempts: 14,
  },
  {
    rank: 5,
    name: 'Jordan Lee',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    score: 87,
    attempts: 11,
  },
];

export function LeaderboardWidget() {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-[#FFD700]" />;
      case 2:
        return <Medal className="h-4 w-4 text-[#C0C0C0]" />;
      case 3:
        return <Award className="h-4 w-4 text-[#CD7F32]" />;
      default:
        return <span className="text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <Card className="glass-surface border-border/50">
      <CardHeader>
        <CardTitle>Top Contributors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockData.map(entry => (
            <div key={entry.rank} className="flex items-center gap-3">
              <div className="flex w-8 justify-center">{getRankIcon(entry.rank)}</div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.avatar} alt={entry.name} />
                <AvatarFallback>{entry.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate">{entry.name}</p>
                <p className="text-muted-foreground text-xs">{entry.attempts} attempts</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {entry.score}
              </Badge>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-6 w-full rounded-xl">
          View Full Leaderboard
        </Button>
      </CardContent>
    </Card>
  );
}

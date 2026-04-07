import { Trophy, Medal, Award, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';

export interface ContributorEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  score: number;
  attempts: number;
}

interface LeaderboardWidgetProps {
  entries: ContributorEntry[];
  isLoading: boolean;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-[#FFD700]" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-[#C0C0C0]" />;
  if (rank === 3) return <Award className="h-4 w-4 text-[#CD7F32]" />;
  return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
}

export function LeaderboardWidget({ entries, isLoading }: LeaderboardWidgetProps) {
  return (
    <Card className="glass-surface border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-5 w-10 rounded" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-muted-foreground">No contributors yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Be the first to solve this case!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.userId} className="flex items-center gap-3">
                <div className="flex w-6 justify-center flex-shrink-0">
                  <RankIcon rank={entry.rank} />
                </div>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={entry.avatar} alt={entry.name} />
                  <AvatarFallback className="text-xs">
                    {entry.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.attempts} {entry.attempts === 1 ? 'attempt' : 'attempts'}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`flex-shrink-0 text-xs ${
                    entry.rank === 1
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : ''
                  }`}
                >
                  {entry.score}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

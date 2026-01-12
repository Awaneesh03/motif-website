'use client';

import { useMemo } from 'react';

import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '../ui/skeleton';

export const DashboardHeader = () => {
  const { displayName, loadingUser } = useUser();

  const greetingName = useMemo(() => displayName?.trim() || 'Founder', [displayName]);

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {loadingUser ? 'Preparing your workspace…' : 'Welcome back,'}
        </p>
        {loadingUser ? (
          <Skeleton className="h-7 w-40" />
        ) : (
          <h2 className="text-2xl font-semibold">{greetingName}</h2>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface FounderScoreBreakdown {
  profile:     number; // max 40
  activity:    number; // max 30
  consistency: number; // max 20
  engagement:  number; // max 10
}

export interface FounderScore {
  score:     number;
  level:     'Beginner' | 'Active' | 'Strong' | 'Investor Ready';
  breakdown: FounderScoreBreakdown;
}

interface UseFounderScoreReturn {
  data:    FounderScore | null;
  loading: boolean;
  error:   string | null;
  refresh: () => void;
}

export function useFounderScore(): UseFounderScoreReturn {
  const [data,    setData]    = useState<FounderScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<FounderScore>('/api/founder/score');
      setData(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load founder score';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

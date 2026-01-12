// Hook to determine if user should see demo mode
// Demo mode is enabled when users have no real data

import { useState, useEffect } from 'react';
import type { Idea } from '../lib/ideasService';
import type { FounderMetrics, VCMetrics, AdminMetrics } from '../lib/metricsService';

interface DemoModeConfig {
  isDemoMode: boolean;
  reason?: 'no-startups' | 'no-connections' | 'low-activity' | 'none';
}

/**
 * Determines if Founder should see demo mode
 * Enabled when they have zero startups
 */
export const useFounderDemoMode = (startups: Idea[], metrics: FounderMetrics | null): DemoModeConfig => {
  const [config, setConfig] = useState<DemoModeConfig>({
    isDemoMode: false,
    reason: 'none',
  });

  useEffect(() => {
    // Enable demo mode if no startups exist
    if (startups.length === 0 && metrics?.totalStartups === 0) {
      setConfig({
        isDemoMode: true,
        reason: 'no-startups',
      });
    } else {
      setConfig({
        isDemoMode: false,
        reason: 'none',
      });
    }
  }, [startups.length, metrics]);

  return config;
};

/**
 * Determines if VC should see demo mode
 * Enabled when they have zero intro requests/connections
 */
export const useVCDemoMode = (
  introRequests: any[],
  connectedStartups: any[],
  metrics: VCMetrics | null
): DemoModeConfig => {
  const [config, setConfig] = useState<DemoModeConfig>({
    isDemoMode: false,
    reason: 'none',
  });

  useEffect(() => {
    // Enable demo mode if no intro requests or connections
    const hasNoActivity =
      introRequests.length === 0 &&
      connectedStartups.length === 0 &&
      metrics?.introRequestsSent === 0;

    if (hasNoActivity) {
      setConfig({
        isDemoMode: true,
        reason: 'no-connections',
      });
    } else {
      setConfig({
        isDemoMode: false,
        reason: 'none',
      });
    }
  }, [introRequests.length, connectedStartups.length, metrics]);

  return config;
};

/**
 * Determines if Admin should see demo mode
 * Enabled when platform has very low activity (< 5 startups)
 */
export const useAdminDemoMode = (
  pendingStartups: any[],
  metrics: AdminMetrics | null
): DemoModeConfig => {
  const [config, setConfig] = useState<DemoModeConfig>({
    isDemoMode: false,
    reason: 'none',
  });

  useEffect(() => {
    // Enable demo mode if platform has very low activity
    const hasLowActivity = metrics && metrics.totalStartups < 5;

    if (hasLowActivity) {
      setConfig({
        isDemoMode: true,
        reason: 'low-activity',
      });
    } else {
      setConfig({
        isDemoMode: false,
        reason: 'none',
      });
    }
  }, [pendingStartups.length, metrics]);

  return config;
};

// Centralized metrics service for dashboard insights
// All metrics are derived from existing tables (ideas, vc_applications, profiles)

import { supabase } from './supabase';

// ============================================================================
// FOUNDER METRICS
// ============================================================================

export interface FounderMetrics {
  totalStartups: number;
  draftStartups: number;
  pendingReview: number;
  approvedForVC: number;
  rejectedStartups: number;
  communityIdeas: number;
}

/**
 * Get all metrics for a founder
 * @param founderId - User ID of the founder
 */
export const getFounderMetrics = async (founderId: string): Promise<FounderMetrics> => {
  try {
    // Get analyzed ideas count from idea_analyses table
    const { data: analyzedIdeas, error: analyzedError } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('user_id', founderId);

    if (analyzedError) {
      console.error('Error fetching analyzed ideas:', analyzedError);
    }

    // Use idea_analyses as the source of truth for all founder ideas
    // NOTE: idea_analyses has no 'status' column — we only count totals
    const totalAnalyzed = analyzedIdeas?.length || 0;

    // Get community ideas posted by this founder
    const { count: communityIdeasCount, error: communityError } = await supabase
      .from('community_ideas')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', founderId);

    if (communityError) {
      console.error('Error fetching community ideas:', communityError);
    }

    return {
      totalStartups: totalAnalyzed,
      draftStartups: 0,
      pendingReview: 0,
      approvedForVC: 0,
      rejectedStartups: 0,
      communityIdeas: communityIdeasCount || 0,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching founder metrics:', error);
    }
    return {
      totalStartups: 0,
      draftStartups: 0,
      pendingReview: 0,
      approvedForVC: 0,
      rejectedStartups: 0,
      communityIdeas: 0,
    };
  }
};

// ============================================================================
// VC METRICS
// ============================================================================

export interface VCMetrics {
  availableStartups: number;
  introRequestsSent: number;
  approvedConnections: number;
  pendingRequests: number;
  rejectedRequests: number;
}

/**
 * Get all metrics for a VC
 * @param vcId - User ID of the VC
 */
export const getVCMetrics = async (vcId: string): Promise<VCMetrics> => {
  try {
    // Get count of available startups (all analyzed ideas visible to VCs)
    // NOTE: idea_analyses has no 'status' column — count all ideas
    const { count: availableCount, error: availableError } = await supabase
      .from('idea_analyses')
      .select('*', { count: 'exact', head: true });

    if (availableError) throw availableError;

    // Get all VC's intro requests
    const { data: requests, error: requestsError } = await supabase
      .from('vc_applications')
      .select('status')
      .eq('vc_id', vcId);

    if (requestsError) throw requestsError;

    const requestCounts = {
      total: requests?.length || 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
    };

    requests?.forEach((request) => {
      const status = request.status as string;
      if (status === 'requested' || status === 'pending') requestCounts.pending++;
      else if (status === 'accepted' || status === 'approved') requestCounts.accepted++;
      else if (status === 'rejected') requestCounts.rejected++;
    });

    return {
      availableStartups: availableCount || 0,
      introRequestsSent: requestCounts.total,
      approvedConnections: requestCounts.accepted,
      pendingRequests: requestCounts.pending,
      rejectedRequests: requestCounts.rejected,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching VC metrics:', error);
    }
    return {
      availableStartups: 0,
      introRequestsSent: 0,
      approvedConnections: 0,
      pendingRequests: 0,
      rejectedRequests: 0,
    };
  }
};

// ============================================================================
// ADMIN PLATFORM METRICS
// ============================================================================

export interface AdminMetrics {
  totalFounders: number;
  totalVCs: number;
  totalStartups: number;
  pendingReview: number;
  approvedStartups: number;
  totalIntroRequests: number;
  approvedIntroRequests: number;
  conversionRate: number; // percentage of approved intro requests
}

/**
 * Get all platform metrics for admin
 */
export const getAdminMetrics = async (): Promise<AdminMetrics> => {
  try {
    // Count founders (role = 'founder')
    const { count: founderCount, error: founderError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'founder');

    if (founderError) throw founderError;

    // Count VCs (role = 'vc')
    const { count: vcCount, error: vcError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'vc');

    if (vcError) throw vcError;

    // Get total startup count (idea_analyses has no 'status' column)
    const { count: startupCount, error: startupsError } = await supabase
      .from('idea_analyses')
      .select('*', { count: 'exact', head: true });

    if (startupsError) throw startupsError;

    // Get all VC intro requests
    const { data: introRequests, error: introError } = await supabase
      .from('vc_applications')
      .select('status');

    if (introError) throw introError;

    const introCounts = {
      total: introRequests?.length || 0,
      approved: 0,
    };

    introRequests?.forEach((request) => {
      const status = request.status as string;
      if (status === 'accepted' || status === 'approved') {
        introCounts.approved++;
      }
    });

    // Calculate conversion rate
    const conversionRate =
      introCounts.total > 0
        ? Math.round((introCounts.approved / introCounts.total) * 100)
        : 0;

    return {
      totalFounders: founderCount || 0,
      totalVCs: vcCount || 0,
      totalStartups: startupCount || 0,
      pendingReview: 0,
      approvedStartups: 0,
      totalIntroRequests: introCounts.total,
      approvedIntroRequests: introCounts.approved,
      conversionRate,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching admin metrics:', error);
    }
    return {
      totalFounders: 0,
      totalVCs: 0,
      totalStartups: 0,
      pendingReview: 0,
      approvedStartups: 0,
      totalIntroRequests: 0,
      approvedIntroRequests: 0,
      conversionRate: 0,
    };
  }
};

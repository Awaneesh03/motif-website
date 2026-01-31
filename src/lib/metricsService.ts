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

    // Get all startups/ideas submitted by founder
    const { data: allStartups, error: startupsError } = await supabase
      .from('ideas')
      .select('*')
      .eq('created_by', founderId);

    if (startupsError) {
      console.error('Error fetching startups:', startupsError);
    }

    const startups = allStartups || [];

    // Count total analyzed ideas
    const totalAnalyzed = analyzedIdeas?.length || 0;

    const statusCounts = {
      total: startups?.length || 0,
      draft: 0,
      pending_review: 0,
      approved_for_vc: 0,
      rejected: 0,
    };

    startups?.forEach((startup: any) => {
      const status = startup.status as string;
      if (status === 'draft') statusCounts.draft++;
      else if (status === 'pending_review') statusCounts.pending_review++;
      else if (status === 'approved_for_vc') statusCounts.approved_for_vc++;
      else if (status === 'rejected') statusCounts.rejected++;
    });

    // Get community ideas posted by this founder
    const { count: communityIdeasCount, error: communityError } = await supabase
      .from('community_ideas')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', founderId);

    if (communityError) {
      console.error('Error fetching community ideas:', communityError);
    }

    return {
      // Use analyzed ideas count + submitted startups count
      totalStartups: totalAnalyzed + statusCounts.total,
      draftStartups: statusCounts.draft,
      pendingReview: statusCounts.pending_review,
      approvedForVC: statusCounts.approved_for_vc,
      rejectedStartups: statusCounts.rejected,
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
    // Get count of available startups (approved_for_vc)
    const { count: availableCount, error: availableError } = await supabase
      .from('ideas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved_for_vc');

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

    // Get all startups with status breakdown
    const { data: startups, error: startupsError } = await supabase
      .from('ideas')
      .select('status');

    if (startupsError) throw startupsError;

    const startupCounts = {
      total: startups?.length || 0,
      pending: 0,
      approved: 0,
    };

    startups?.forEach((startup) => {
      const status = startup.status as string;
      if (status === 'pending_review') startupCounts.pending++;
      else if (status === 'approved_for_vc') startupCounts.approved++;
    });

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
      totalStartups: startupCounts.total,
      pendingReview: startupCounts.pending,
      approvedStartups: startupCounts.approved,
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

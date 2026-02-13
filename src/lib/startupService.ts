// Supabase-based service for managing startups
// A startup = an idea that has a pitch

import { supabase } from './supabase';
import {
  canAdminApprove,
  canAdminReject,
  canFounderSubmitForReview,
} from './statusValidation';
import { verifyAdminRole, verifyFounderRole } from './roleVerification';

export type StartupStatus = 'draft' | 'pending_review' | 'approved_for_vc' | 'rejected' | 'active';

export interface Startup {
  id: string;
  name: string;
  pitch: string;
  problem: string;
  solution: string;
  industry: string;
  stage: string;
  status: StartupStatus;
  createdBy: string; // founder user id
  founderName: string;
  createdAt: string;
}

// Get all startups (ideas with pitches)
export const getAllStartups = async (): Promise<Startup[]> => {
  try {
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.title || 'Untitled',
      pitch: item.description || '',
      problem: item.description || '',
      solution: item.description || '',
      industry: item.industry || 'Not specified',
      stage: 'idea',
      status: item.status || 'draft',
      createdBy: item.user_id,
      founderName: 'Unknown',
      createdAt: item.created_at || new Date().toISOString(),
    }));
  } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading startups:', error);
      }
    return [];
  }
};

// Get startups by founder
export const getStartupsByFounder = async (founderId: string): Promise<Startup[]> => {
  try {
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('user_id', founderId)
      .order('id', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.title || 'Untitled',
      pitch: item.description || '',
      problem: item.description || '',
      solution: item.description || '',
      industry: item.industry || 'Not specified',
      stage: 'idea',
      status: item.status || 'draft',
      createdBy: item.user_id || founderId,
      founderName: 'Unknown',
      createdAt: item.created_at || new Date().toISOString(),
    }));
  } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching startups by founder:', error);
      }
    return [];
  }
};

// Get approved startups (for VCs)
export const getApprovedStartups = async (): Promise<Startup[]> => {
  try {
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('status', 'approved_for_vc')
      .order('id', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.title || 'Untitled',
      pitch: item.description || '',
      problem: item.description || '',
      solution: item.description || '',
      industry: item.industry || 'Not specified',
      stage: 'idea',
      status: item.status || 'draft',
      createdBy: item.user_id,
      founderName: 'Unknown',
      createdAt: item.created_at || new Date().toISOString(),
    }));
  } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching approved startups:', error);
      }
    return [];
  }
};

// Create new startup (not used - pitches are created via PitchCreatorPage)
export const createStartup = async (
  startup: Omit<Startup, 'id' | 'createdAt'>
): Promise<Startup | null> => {
  try {
    // Create idea first
    const { data: ideaData, error: ideaError } = await supabase
      .from('idea_analyses')
      .insert({
        title: startup.name,
        description: startup.pitch,
        industry: startup.industry,
        status: startup.status,
        user_id: startup.createdBy,
      })
      .select()
      .single();

    if (ideaError) throw ideaError;

    // Create pitch linked to idea
    const { error: pitchError } = await supabase
      .from('pitches')
      .insert({
        user_id: startup.createdBy,
        idea_id: ideaData.id,
        title: startup.name,
      });

    if (pitchError) throw pitchError;

    // Fetch founder name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', startup.createdBy)
      .single();

    return {
      ...startup,
      id: ideaData.id,
      createdAt: ideaData.created_at || new Date().toISOString(),
      founderName: profileData?.full_name || profileData?.username || 'Unknown',
    };
  } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating startup:', error);
      }
    return null;
  }
};

// Update startup status with validation
export const updateStartupStatus = async (
  id: string,
  status: StartupStatus,
  options?: { skipValidation?: boolean }
): Promise<Startup | null> => {
  try {
    // Fetch current status first
    const { data: currentData, error: fetchError } = await supabase
      .from('idea_analyses')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const currentStatus = currentData?.status as StartupStatus;

    // GUARDRAIL: Validate status transition (unless explicitly skipped)
    if (!options?.skipValidation) {
      // Validate based on the target status
      if (status === 'approved_for_vc') {
        // PERMISSION CHECK: Only admins can approve
        const roleCheck = await verifyAdminRole();
        if (!roleCheck.valid) {
          throw new Error(roleCheck.error || 'Admin privileges required to approve startups');
        }

        const validation = canAdminApprove(currentStatus);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      } else if (status === 'rejected') {
        // PERMISSION CHECK: Only admins can reject
        const roleCheck = await verifyAdminRole();
        if (!roleCheck.valid) {
          throw new Error(roleCheck.error || 'Admin privileges required to reject startups');
        }

        const validation = canAdminReject(currentStatus);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      } else if (status === 'pending_review') {
        // PERMISSION CHECK: Only founders can submit for review
        const roleCheck = await verifyFounderRole();
        if (!roleCheck.valid) {
          throw new Error(roleCheck.error || 'Founder privileges required to submit for review');
        }

        const validation = canFounderSubmitForReview(currentStatus);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
    }

    const { data, error } = await supabase
      .from('idea_analyses')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.title || 'Untitled',
      pitch: data.description || '',
      problem: data.description || '',
      solution: data.description || '',
      industry: data.industry || 'Not specified',
      stage: 'idea',
      status: data.status || 'draft',
      createdBy: data.user_id,
      founderName: 'Unknown',
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error updating startup status:', error);
      }
    // Re-throw to allow caller to handle
    throw error;
  }
};

// Get single startup
export const getStartupById = async (id: string): Promise<Startup | null> => {
  try {
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.title || 'Untitled',
      pitch: data.description || '',
      problem: data.description || '',
      solution: data.description || '',
      industry: data.industry || 'Not specified',
      stage: 'idea',
      status: data.status || 'draft',
      createdBy: data.user_id,
      founderName: 'Unknown',
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching startup by ID:', error);
      }
    return null;
  }
};

// Supabase-based service for managing startups
// A startup = an idea that has a pitch

import { supabase } from './supabase';

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
      name: item.idea_title || 'Untitled',
      pitch: item.idea_description || '',
      problem: item.idea_description || '',
      solution: item.idea_description || '',
      industry: item.target_market || 'Not specified',
      stage: 'idea',
      status: 'draft',
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
      name: item.idea_title || 'Untitled',
      pitch: item.idea_description || '',
      problem: item.idea_description || '',
      solution: item.idea_description || '',
      industry: item.target_market || 'Not specified',
      stage: 'idea',
      status: 'draft',
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
// NOTE: idea_analyses has no 'status' column — fetches all and lets caller filter
export const getApprovedStartups = async (): Promise<Startup[]> => {
  try {
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.idea_title || 'Untitled',
      pitch: item.idea_description || '',
      problem: item.idea_description || '',
      solution: item.idea_description || '',
      industry: item.target_market || 'Not specified',
      stage: 'idea',
      status: 'draft',
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
        idea_title: startup.name,
        idea_description: startup.pitch,
        target_market: startup.industry,
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
// NOTE: idea_analyses table does not have a 'status' column.
// This function is kept for compatibility but status updates
// should be handled by the backend or a dedicated status table.
export const updateStartupStatus = async (
  id: string,
  status: StartupStatus,
  options?: { skipValidation?: boolean }
): Promise<Startup | null> => {
  try {
    // GUARDRAIL: Validate status transition (unless explicitly skipped)
    if (!options?.skipValidation) {
      if (status === 'approved_for_vc' || status === 'rejected') {
        const roleCheck = await verifyAdminRole();
        if (!roleCheck.valid) {
          throw new Error(roleCheck.error || 'Admin privileges required');
        }
      } else if (status === 'pending_review') {
        const roleCheck = await verifyFounderRole();
        if (!roleCheck.valid) {
          throw new Error(roleCheck.error || 'Founder privileges required to submit for review');
        }
      }
    }

    // Fetch the idea to return it
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.idea_title || 'Untitled',
      pitch: data.idea_description || '',
      problem: data.idea_description || '',
      solution: data.idea_description || '',
      industry: data.target_market || 'Not specified',
      stage: 'idea',
      status: status,
      createdBy: data.user_id,
      founderName: 'Unknown',
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error updating startup status:', error);
      }
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
      name: data.idea_title || 'Untitled',
      pitch: data.idea_description || '',
      problem: data.idea_description || '',
      solution: data.idea_description || '',
      industry: data.target_market || 'Not specified',
      stage: 'idea',
      status: 'draft',
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

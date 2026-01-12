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
      .from('ideas')
      .select(`
        id,
        title,
        name,
        description,
        target_market,
        stage,
        status,
        created_by,
        created_at,
        pitches!inner(id),
        profiles!created_by(full_name, username)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name || item.title || 'Untitled',
      pitch: item.description || '',
      problem: item.description || '',
      solution: item.description || '',
      industry: item.target_market || 'Not specified',
      stage: item.stage || 'idea',
      status: item.status || 'draft',
      createdBy: item.created_by,
      founderName: item.profiles?.full_name || item.profiles?.username || 'Unknown',
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error('Error loading startups:', error);
    return [];
  }
};

// Get startups by founder
export const getStartupsByFounder = async (founderId: string): Promise<Startup[]> => {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        id,
        title,
        name,
        description,
        target_market,
        stage,
        status,
        created_by,
        created_at,
        pitches!inner(id),
        profiles!created_by(full_name, username)
      `)
      .eq('created_by', founderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name || item.title || 'Untitled',
      pitch: item.description || '',
      problem: item.description || '',
      solution: item.description || '',
      industry: item.target_market || 'Not specified',
      stage: item.stage || 'idea',
      status: item.status || 'draft',
      createdBy: item.created_by,
      founderName: item.profiles?.full_name || item.profiles?.username || 'Unknown',
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error('Error fetching startups by founder:', error);
    return [];
  }
};

// Get approved startups (for VCs)
export const getApprovedStartups = async (): Promise<Startup[]> => {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        id,
        title,
        name,
        description,
        target_market,
        stage,
        status,
        created_by,
        created_at,
        pitches!inner(id),
        profiles!created_by(full_name, username)
      `)
      .eq('status', 'approved_for_vc')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name || item.title || 'Untitled',
      pitch: item.description || '',
      problem: item.description || '',
      solution: item.description || '',
      industry: item.target_market || 'Not specified',
      stage: item.stage || 'idea',
      status: item.status || 'draft',
      createdBy: item.created_by,
      founderName: item.profiles?.full_name || item.profiles?.username || 'Unknown',
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error('Error fetching approved startups:', error);
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
      .from('ideas')
      .insert({
        title: startup.name,
        description: startup.pitch,
        target_market: startup.industry,
        stage: startup.stage,
        status: startup.status,
        created_by: startup.createdBy,
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
      createdAt: ideaData.created_at,
      founderName: profileData?.full_name || profileData?.username || 'Unknown',
    };
  } catch (error) {
    console.error('Error creating startup:', error);
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
      .from('ideas')
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
      .from('ideas')
      .update({ status })
      .eq('id', id)
      .select(`
        id,
        title,
        name,
        description,
        target_market,
        stage,
        status,
        created_by,
        created_at,
        profiles!created_by(full_name, username)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name || data.title || 'Untitled',
      pitch: data.description || '',
      problem: data.description || '',
      solution: data.description || '',
      industry: data.target_market || 'Not specified',
      stage: data.stage || 'idea',
      status: data.status || 'draft',
      createdBy: data.created_by,
      founderName: (data.profiles as any)?.full_name || (data.profiles as any)?.username || 'Unknown',
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error updating startup status:', error);
    // Re-throw to allow caller to handle
    throw error;
  }
};

// Get single startup
export const getStartupById = async (id: string): Promise<Startup | null> => {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        id,
        title,
        name,
        description,
        target_market,
        stage,
        status,
        created_by,
        created_at,
        pitches!inner(id),
        profiles!created_by(full_name, username)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name || data.title || 'Untitled',
      pitch: data.description || '',
      problem: data.description || '',
      solution: data.description || '',
      industry: data.target_market || 'Not specified',
      stage: data.stage || 'idea',
      status: data.status || 'draft',
      createdBy: data.created_by,
      founderName: (data.profiles as any)?.full_name || (data.profiles as any)?.username || 'Unknown',
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error fetching startup by ID:', error);
    return null;
  }
};

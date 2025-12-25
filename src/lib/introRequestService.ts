// Supabase-based service for managing intro requests
// Maps to vc_applications table with joins for VC and startup names

import { supabase } from './supabase';

export type IntroRequestStatus = 'requested' | 'approved' | 'rejected';

export interface IntroRequest {
  id: string;
  startupId: string;
  vcId: string;
  vcName: string;
  startupName: string;
  status: IntroRequestStatus;
  createdAt: string;
}

// Helper to transform DB row to IntroRequest
const transformToIntroRequest = (row: any): IntroRequest => {
  return {
    id: row.id,
    startupId: row.idea_id,
    vcId: row.vc_id,
    vcName: row.vc_profile?.name || row.vc_profile?.full_name || '',
    startupName: row.startup?.name || '',
    status: row.status,
    createdAt: row.created_at,
  };
};

// Get all intro requests
export const getAllIntroRequests = async (): Promise<IntroRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('vc_applications')
      .select(`
        *,
        vc_profile:profiles!vc_applications_vc_id_fkey(name, full_name),
        startup:startups!vc_applications_idea_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformToIntroRequest);
  } catch (error) {
    console.error('Error fetching intro requests:', error);
    return [];
  }
};

// Get intro requests by VC
export const getIntroRequestsByVC = async (vcId: string): Promise<IntroRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('vc_applications')
      .select(`
        *,
        vc_profile:profiles!vc_applications_vc_id_fkey(name, full_name),
        startup:startups!vc_applications_idea_id_fkey(name)
      `)
      .eq('vc_id', vcId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformToIntroRequest);
  } catch (error) {
    console.error('Error fetching intro requests by VC:', error);
    return [];
  }
};

// Get intro requests by startup
export const getIntroRequestsByStartup = async (startupId: string): Promise<IntroRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('vc_applications')
      .select(`
        *,
        vc_profile:profiles!vc_applications_vc_id_fkey(name, full_name),
        startup:startups!vc_applications_idea_id_fkey(name)
      `)
      .eq('idea_id', startupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformToIntroRequest);
  } catch (error) {
    console.error('Error fetching intro requests by startup:', error);
    return [];
  }
};

// Check if intro request exists
export const hasIntroRequest = async (vcId: string, startupId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('vc_applications')
      .select('id')
      .eq('vc_id', vcId)
      .eq('idea_id', startupId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking intro request:', error);
    return false;
  }
};

// Create intro request
export const createIntroRequest = async (
  request: Omit<IntroRequest, 'id' | 'createdAt'>
): Promise<IntroRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('vc_applications')
      .insert({
        idea_id: request.startupId,
        vc_id: request.vcId,
        status: request.status,
      })
      .select(`
        *,
        vc_profile:profiles!vc_applications_vc_id_fkey(name, full_name),
        startup:startups!vc_applications_idea_id_fkey(name)
      `)
      .single();

    if (error) throw error;
    return data ? transformToIntroRequest(data) : null;
  } catch (error) {
    console.error('Error creating intro request:', error);
    return null;
  }
};

// Update intro request status (admin only)
export const updateIntroRequestStatus = async (
  id: string,
  status: IntroRequestStatus
): Promise<IntroRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('vc_applications')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        vc_profile:profiles!vc_applications_vc_id_fkey(name, full_name),
        startup:startups!vc_applications_idea_id_fkey(name)
      `)
      .single();

    if (error) throw error;
    return data ? transformToIntroRequest(data) : null;
  } catch (error) {
    console.error('Error updating intro request status:', error);
    return null;
  }
};

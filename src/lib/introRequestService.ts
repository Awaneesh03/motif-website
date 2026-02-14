// Supabase-based service for managing intro requests
// Maps to vc_applications table with joins for VC and startup names

import { supabase } from './supabase';
import { verifyVCRole, verifyFounderRole, verifyAdminRole, getCurrentUserRole } from './roleVerification';
import { safeFetchList, safeFetchCount, safeFetchExists } from './safeFetch';

export type IntroRequestStatus = 'requested' | 'approved' | 'rejected';

export interface IntroRequest {
  id: string;
  startupId: string;
  vcId: string | null;
  vcName: string;
  startupName: string;
  status: IntroRequestStatus;
  createdAt: string;
}

export interface ConnectedVC {
  id: string;
  vcId: string;
  vcName: string;
  vcFirm?: string;
  vcRole?: string;
  connectedAt: string;
}

export interface ConnectedStartup {
  id: string;
  startupId: string;
  startupName: string;
  startupDescription?: string;
  stage?: string;
  industry?: string;
  founderName?: string;
  connectedAt: string;
}

// Get all intro requests
export const getAllIntroRequests = async (): Promise<IntroRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('vc_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      startupId: row.idea_id,
      vcId: row.vc_id || null,
      vcName: 'VC',
      startupName: 'Startup',
      status: row.status,
      createdAt: row.created_at,
    }));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching intro requests:', error);
    }
    return [];
  }
};

// Get intro requests by VC
export const getIntroRequestsByVC = async (vcId: string): Promise<IntroRequest[]> => {
  // Guard: Only VCs and admins can fetch VC intro requests
  const role = await getCurrentUserRole();
  if (!role || (role !== 'vc' && role !== 'super_admin')) {
    return [];
  }

  // Guard: VC ID required
  if (!vcId) {
    return [];
  }

  const data = await safeFetchList(
    () =>
      supabase
        .from('vc_applications')
        .select('*')
        .eq('vc_id', vcId)
        .order('created_at', { ascending: false }),
    { serviceName: 'introRequestService.getIntroRequestsByVC' }
  );

  return data.map((row: any) => ({
    id: row.id,
    startupId: row.idea_id,
    vcId: row.vc_id || null,
    vcName: 'VC',
    startupName: 'Startup',
    status: row.status,
    createdAt: row.created_at,
  }));
};

// Get intro requests by startup (idea)
export const getIntroRequestsByStartup = async (startupId: string): Promise<IntroRequest[]> => {
  // Guard: Only founders and admins can fetch startup intro requests
  const role = await getCurrentUserRole();
  if (!role || (role !== 'founder' && role !== 'super_admin')) {
    return [];
  }

  // Guard: Startup ID required
  if (!startupId) {
    return [];
  }

  const data = await safeFetchList(
    () =>
      supabase
        .from('vc_applications')
        .select('*')
        .eq('idea_id', startupId)
        .order('created_at', { ascending: false }),
    { serviceName: 'introRequestService.getIntroRequestsByStartup' }
  );

  return data.map((row: any) => ({
    id: row.id,
    startupId: row.idea_id,
    vcId: row.vc_id || null,
    vcName: 'VC',
    startupName: 'Startup',
    status: row.status,
    createdAt: row.created_at,
  }));
};

// Check if intro request exists (by VC and startup)
export const hasIntroRequest = async (vcId: string, startupId: string): Promise<boolean> => {
  // Guard: IDs required
  if (!vcId || !startupId) {
    return false;
  }

  return safeFetchExists(
    () =>
      supabase
        .from('vc_applications')
        .select('id')
        .eq('vc_id', vcId)
        .eq('idea_id', startupId)
        .limit(1)
        .maybeSingle(),
    { serviceName: 'introRequestService.hasIntroRequest' }
  );
};

// Check if founder has already requested VC intro for this startup
export const hasFounderRequestedIntro = async (startupId: string): Promise<boolean> => {
  // Guard: Startup ID required
  if (!startupId) {
    return false;
  }

  return safeFetchExists(
    () =>
      supabase
        .from('vc_applications')
        .select('id')
        .eq('idea_id', startupId)
        .is('vc_id', null)
        .limit(1)
        .maybeSingle(),
    { serviceName: 'introRequestService.hasFounderRequestedIntro' }
  );
};

// Create intro request (VC requesting intro to a startup)
export const createIntroRequest = async (
  vcId: string,
  startupId: string
): Promise<IntroRequest | null> => {
  try {
    // PERMISSION CHECK: Only VCs can create intro requests
    const roleCheck = await verifyVCRole();
    if (!roleCheck.valid) {
      throw new Error(roleCheck.error || 'VC privileges required to request introductions');
    }

    // GUARDRAIL: Check if request already exists (prevent duplicates)
    const exists = await hasIntroRequest(vcId, startupId);
    if (exists) {
      console.warn('Duplicate intro request prevented:', { vcId, startupId });
      throw new Error('You have already requested an introduction to this startup.');
    }

    const { data, error } = await supabase
      .from('vc_applications')
      .insert({
        idea_id: startupId,
        vc_id: vcId,
        status: 'requested',
      })
      .select('*')
      .single();

    if (error) {
      // Check if it's a unique constraint violation (fallback guard)
      if (error.code === '23505') {
        throw new Error('You have already requested an introduction to this startup.');
      }
      throw error;
    }
    return data ? {
      id: data.id,
      startupId: data.idea_id,
      vcId: data.vc_id || null,
      vcName: 'VC',
      startupName: 'Startup',
      status: data.status,
      createdAt: data.created_at,
    } : null;
  } catch (error) {
    console.error('Error creating intro request:', error);
    // Re-throw to allow caller to handle
    throw error;
  }
};

// Create founder-initiated VC intro request (vc_id is null)
export const createFounderIntroRequest = async (
  startupId: string
): Promise<IntroRequest | null> => {
  try {
    // PERMISSION CHECK: Only founders can create founder intro requests
    const roleCheck = await verifyFounderRole();
    if (!roleCheck.valid) {
      throw new Error(roleCheck.error || 'Founder privileges required to request VC introductions');
    }

    // GUARDRAIL: Check if founder already requested intro for this startup
    const exists = await hasFounderRequestedIntro(startupId);
    if (exists) {
      console.warn('Duplicate founder intro request prevented:', { startupId });
      throw new Error('You have already requested VC introductions for this startup.');
    }

    const { data, error } = await supabase
      .from('vc_applications')
      .insert({
        idea_id: startupId,
        vc_id: null,
        status: 'requested',
      })
      .select('*')
      .single();

    if (error) {
      // Check if it's a unique constraint violation (fallback guard)
      if (error.code === '23505') {
        throw new Error('You have already requested VC introductions for this startup.');
      }
      throw error;
    }
    return data ? {
      id: data.id,
      startupId: data.idea_id,
      vcId: data.vc_id || null,
      vcName: 'VC',
      startupName: 'Startup',
      status: data.status,
      createdAt: data.created_at,
    } : null;
  } catch (error) {
    console.error('Error creating founder intro request:', error);
    // Re-throw to allow caller to handle
    throw error;
  }
};

// Update intro request status (admin only)
export const updateIntroRequestStatus = async (
  id: string,
  status: IntroRequestStatus
): Promise<IntroRequest | null> => {
  try {
    // PERMISSION CHECK: Only admins can update intro request status
    const roleCheck = await verifyAdminRole();
    if (!roleCheck.valid) {
      throw new Error(roleCheck.error || 'Admin privileges required to approve/reject intro requests');
    }

    const { data, error } = await supabase
      .from('vc_applications')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data ? {
      id: data.id,
      startupId: data.idea_id,
      vcId: data.vc_id || null,
      vcName: 'VC',
      startupName: 'Startup',
      status: data.status,
      createdAt: data.created_at,
    } : null;
  } catch (error) {
    console.error('Error updating intro request status:', error);
    return null;
  }
};

// Get connected VCs for a startup (approved intro requests)
export const getConnectedVCs = async (startupId: string): Promise<ConnectedVC[]> => {
  // Guard: Only founders and admins can view connected VCs for a startup
  const role = await getCurrentUserRole();
  if (!role || (role !== 'founder' && role !== 'super_admin')) {
    return [];
  }

  // Guard: Startup ID required
  if (!startupId) {
    return [];
  }

  const data = await safeFetchList(
    () =>
      supabase
        .from('vc_applications')
        .select(`
          id,
          vc_id,
          created_at,
          updated_at,
          vc_id
        `)
        .eq('idea_id', startupId)
        .eq('status', 'approved')
        .not('vc_id', 'is', null)
        .order('created_at', { ascending: false }),
    { serviceName: 'introRequestService.getConnectedVCs' }
  );

  return data.map((row: any) => ({
    id: row.id,
    vcId: row.vc_id,
    vcName: 'VC',
    vcFirm: undefined,
    vcRole: undefined,
    connectedAt: row.updated_at || row.created_at,
  }));
};

// Get connected startups for a VC (approved intro requests)
export const getConnectedStartups = async (vcId: string): Promise<ConnectedStartup[]> => {
  // Guard: Only VCs and admins can view connected startups
  const role = await getCurrentUserRole();
  if (!role || (role !== 'vc' && role !== 'super_admin')) {
    return [];
  }

  // Guard: VC ID required
  if (!vcId) {
    return [];
  }

  const data = await safeFetchList(
    () =>
      supabase
        .from('vc_applications')
        .select('*')
        .eq('vc_id', vcId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
    { serviceName: 'introRequestService.getConnectedStartups' }
  );

  return data.map((row: any) => ({
    id: row.id,
    startupId: row.idea_id,
    startupName: 'Startup',
    startupDescription: undefined,
    stage: undefined,
    industry: undefined,
    founderName: 'Founder',
    connectedAt: row.updated_at || row.created_at,
  }));
};

// Check if VC is already connected to a startup
export const isConnected = async (vcId: string, startupId: string): Promise<boolean> => {
  // Guard: IDs required
  if (!vcId || !startupId) {
    return false;
  }

  return safeFetchExists(
    () =>
      supabase
        .from('vc_applications')
        .select('id')
        .eq('vc_id', vcId)
        .eq('idea_id', startupId)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle(),
    { serviceName: 'introRequestService.isConnected' }
  );
};

// Get total number of connections for a VC (for credibility display)
export const getVCConnectionCount = async (vcId: string): Promise<number> => {
  // Guard: VC ID required
  if (!vcId) {
    return 0;
  }

  return safeFetchCount(
    () =>
      supabase
        .from('vc_applications')
        .select('*', { count: 'exact', head: true })
        .eq('vc_id', vcId)
        .eq('status', 'approved'),
    { serviceName: 'introRequestService.getVCConnectionCount' }
  );
};

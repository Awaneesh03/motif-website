// Role verification utilities for service-layer permission checks
// Provides fast-fail validation before database operations

import { supabase } from './supabase';

export type UserRole = 'super_admin' | 'founder' | 'vc' | 'vc_pending';

export interface RoleVerificationResult {
  valid: boolean;
  role?: UserRole;
  error?: string;
}

/**
 * Get the current authenticated user's role
 * @returns User role or null if not authenticated
 */
export const getCurrentUserRole = async (): Promise<UserRole | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return profile.role as UserRole;
  } catch (error) {
    console.error('Error getting current user role:', error);
    return null;
  }
};

/**
 * Verify if the current user has admin privileges
 * @returns Verification result with role and validation status
 */
export const verifyAdminRole = async (): Promise<RoleVerificationResult> => {
  const role = await getCurrentUserRole();

  if (!role) {
    return {
      valid: false,
      error: 'User not authenticated',
    };
  }

  if (role !== 'super_admin') {
    return {
      valid: false,
      role,
      error: 'Permission denied: Admin privileges required',
    };
  }

  return {
    valid: true,
    role,
  };
};

/**
 * Verify if the current user is a VC
 * @returns Verification result with role and validation status
 */
export const verifyVCRole = async (): Promise<RoleVerificationResult> => {
  const role = await getCurrentUserRole();

  if (!role) {
    return {
      valid: false,
      error: 'User not authenticated',
    };
  }

  if (role !== 'vc') {
    return {
      valid: false,
      role,
      error: 'Permission denied: VC privileges required',
    };
  }

  return {
    valid: true,
    role,
  };
};

/**
 * Verify if the current user is a founder
 * @returns Verification result with role and validation status
 */
export const verifyFounderRole = async (): Promise<RoleVerificationResult> => {
  const role = await getCurrentUserRole();

  if (!role) {
    return {
      valid: false,
      error: 'User not authenticated',
    };
  }

  if (role !== 'founder') {
    return {
      valid: false,
      role,
      error: 'Permission denied: Founder privileges required',
    };
  }

  return {
    valid: true,
    role,
  };
};

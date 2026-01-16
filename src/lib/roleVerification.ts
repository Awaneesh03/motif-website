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

/**
 * Verify if the current user has any of the specified roles
 * @param allowedRoles - Array of allowed roles
 * @returns Verification result with role and validation status
 */
export const verifyAnyRole = async (
  allowedRoles: UserRole[]
): Promise<RoleVerificationResult> => {
  const role = await getCurrentUserRole();

  if (!role) {
    return {
      valid: false,
      error: 'User not authenticated',
    };
  }

  if (!allowedRoles.includes(role)) {
    return {
      valid: false,
      role,
      error: `Permission denied: Requires one of: ${allowedRoles.join(', ')}`,
    };
  }

  return {
    valid: true,
    role,
  };
};

/**
 * Verify if the current user owns a specific resource
 * @param resourceOwnerId - ID of the resource owner
 * @returns Verification result
 */
export const verifyResourceOwnership = async (
  resourceOwnerId: string
): Promise<RoleVerificationResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        valid: false,
        error: 'User not authenticated',
      };
    }

    // Admins can access all resources
    const role = await getCurrentUserRole();
    if (role === 'super_admin') {
      return {
        valid: true,
        role,
      };
    }

    if (user.id !== resourceOwnerId) {
      return {
        valid: false,
        role: role || undefined,
        error: 'Permission denied: You do not own this resource',
      };
    }

    return {
      valid: true,
      role: role || undefined,
    };
  } catch (error) {
    console.error('Error verifying resource ownership:', error);
    return {
      valid: false,
      error: 'Error verifying permissions',
    };
  }
};

/**
 * Assert admin role - throws if not admin
 * Use this for cleaner error handling in async functions
 */
export const assertAdminRole = async (): Promise<void> => {
  const verification = await verifyAdminRole();
  if (!verification.valid) {
    throw new Error(verification.error || 'Admin privileges required');
  }
};

/**
 * Assert VC role - throws if not VC
 * Use this for cleaner error handling in async functions
 */
export const assertVCRole = async (): Promise<void> => {
  const verification = await verifyVCRole();
  if (!verification.valid) {
    throw new Error(verification.error || 'VC privileges required');
  }
};

/**
 * Assert founder role - throws if not founder
 * Use this for cleaner error handling in async functions
 */
export const assertFounderRole = async (): Promise<void> => {
  const verification = await verifyFounderRole();
  if (!verification.valid) {
    throw new Error(verification.error || 'Founder privileges required');
  }
};

/**
 * Assert resource ownership - throws if user doesn't own resource
 * Use this for cleaner error handling in async functions
 */
export const assertResourceOwnership = async (resourceOwnerId: string): Promise<void> => {
  const verification = await verifyResourceOwnership(resourceOwnerId);
  if (!verification.valid) {
    throw new Error(verification.error || 'Permission denied');
  }
};

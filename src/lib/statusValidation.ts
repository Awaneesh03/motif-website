// Centralized status validation service
// Enforces valid state transitions and prevents invalid actions

import type { StartupStatus } from './startupService';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates if a founder can submit a startup for review
 * @param currentStatus - Current status of the startup
 * @returns Validation result with error message if invalid
 */
export const canFounderSubmitForReview = (
  currentStatus: StartupStatus | undefined
): ValidationResult => {
  // Can submit from draft or rejected states only
  if (currentStatus === 'draft' || currentStatus === 'rejected') {
    return { valid: true };
  }

  if (currentStatus === 'pending_review') {
    return {
      valid: false,
      error: 'This startup is already under review.',
    };
  }

  if (currentStatus === 'approved_for_vc') {
    return {
      valid: false,
      error: 'This startup has been approved and cannot be modified.',
    };
  }

  if (currentStatus === 'active') {
    return {
      valid: false,
      error: 'Active startups cannot be resubmitted.',
    };
  }

  return {
    valid: false,
    error: 'Invalid startup status.',
  };
};

/**
 * Validates if a VC can request an intro to a startup
 * @param startupStatus - Current status of the startup
 * @returns Validation result with error message if invalid
 */
export const canVCRequestIntro = (
  startupStatus: StartupStatus | undefined
): ValidationResult => {
  // VCs can only request intro to approved startups
  if (startupStatus === 'approved_for_vc') {
    return { valid: true };
  }

  if (startupStatus === 'draft') {
    return {
      valid: false,
      error: 'This startup is still in draft and not available for intro requests.',
    };
  }

  if (startupStatus === 'pending_review') {
    return {
      valid: false,
      error: 'This startup is under review and not yet available.',
    };
  }

  if (startupStatus === 'rejected') {
    return {
      valid: false,
      error: 'This startup was rejected and is not available.',
    };
  }

  return {
    valid: false,
    error: 'This startup is not available for intro requests.',
  };
};

/**
 * Validates if an admin can approve a startup
 * @param currentStatus - Current status of the startup
 * @returns Validation result with error message if invalid
 */
export const canAdminApprove = (
  currentStatus: StartupStatus | undefined
): ValidationResult => {
  // Can only approve from pending_review state
  if (currentStatus === 'pending_review') {
    return { valid: true };
  }

  if (currentStatus === 'draft') {
    return {
      valid: false,
      error: 'Cannot approve a draft startup. Founder must submit it first.',
    };
  }

  if (currentStatus === 'approved_for_vc') {
    return {
      valid: false,
      error: 'This startup is already approved.',
    };
  }

  if (currentStatus === 'rejected') {
    return {
      valid: false,
      error: 'This startup is rejected. Founder must resubmit it first.',
    };
  }

  return {
    valid: false,
    error: 'Invalid status for approval.',
  };
};

/**
 * Validates if an admin can reject a startup
 * @param currentStatus - Current status of the startup
 * @returns Validation result with error message if invalid
 */
export const canAdminReject = (
  currentStatus: StartupStatus | undefined
): ValidationResult => {
  // Can only reject from pending_review state
  if (currentStatus === 'pending_review') {
    return { valid: true };
  }

  if (currentStatus === 'draft') {
    return {
      valid: false,
      error: 'Cannot reject a draft startup.',
    };
  }

  if (currentStatus === 'approved_for_vc') {
    return {
      valid: false,
      error: 'Cannot reject an already approved startup.',
    };
  }

  if (currentStatus === 'rejected') {
    return {
      valid: false,
      error: 'This startup is already rejected.',
    };
  }

  return {
    valid: false,
    error: 'Invalid status for rejection.',
  };
};

/**
 * Validates if a status transition is valid
 * @param currentStatus - Current status
 * @param newStatus - Desired new status
 * @param userRole - Role of the user attempting the transition
 * @returns Validation result with error message if invalid
 */
export const isValidStatusTransition = (
  currentStatus: StartupStatus | undefined,
  newStatus: StartupStatus,
  userRole: 'founder' | 'admin' | 'vc'
): ValidationResult => {
  if (!currentStatus) {
    return {
      valid: false,
      error: 'Current status is unknown.',
    };
  }

  // Define valid transitions
  const validTransitions: Record<
    StartupStatus,
    Partial<Record<'founder' | 'admin' | 'vc', StartupStatus[]>>
  > = {
    draft: {
      founder: ['pending_review'],
      admin: [],
    },
    pending_review: {
      founder: [],
      admin: ['approved_for_vc', 'rejected'],
    },
    rejected: {
      founder: ['pending_review'],
      admin: [],
    },
    approved_for_vc: {
      founder: [],
      admin: ['active'], // Future: admin can activate
    },
    active: {
      founder: [],
      admin: [],
    },
  };

  const allowedTransitions = validTransitions[currentStatus]?.[userRole] || [];

  if (allowedTransitions.includes(newStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `Cannot transition from ${currentStatus} to ${newStatus} as ${userRole}.`,
  };
};

/**
 * Helper to get user-friendly error messages for status transitions
 */
export const getStatusTransitionError = (
  currentStatus: StartupStatus | undefined,
  action: string
): string => {
  const statusLabels: Record<StartupStatus, string> = {
    draft: 'Draft',
    pending_review: 'Under Review',
    approved_for_vc: 'Approved',
    rejected: 'Rejected',
    active: 'Active',
  };

  const currentLabel = currentStatus
    ? statusLabels[currentStatus]
    : 'Unknown';

  return `Cannot ${action} a ${currentLabel} startup.`;
};

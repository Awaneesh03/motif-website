// Role enum
export enum UserRole {
  SUPER_ADMIN = 'super_admin', // Database value (kept for backward compatibility)
  ADMIN = 'admin', // Normalized frontend value
  FOUNDER = 'founder',
  VC = 'vc',
  VC_PENDING = 'vc_pending',
}

// Permission helper
export const hasAccess = (
  userRole: UserRole | string | undefined,
  allowedRoles: UserRole[]
): boolean => {
  if (!userRole) return false;

  // Normalize: treat 'admin' and 'super_admin' as equivalent
  const normalizedRole = userRole === 'super_admin' ? 'admin' : userRole;
  const normalizedAllowed = allowedRoles.map(role =>
    role === UserRole.SUPER_ADMIN ? UserRole.ADMIN : role
  );

  return normalizedAllowed.some(role => role === normalizedRole);
};

// Get default route for role
export const getRoleDefaultRoute = (role: UserRole | string | undefined): string => {
  // Default to founder dashboard for missing/invalid roles
  if (!role || role === 'no-role' || role === '') {
    return '/dashboard/home';
  }

  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
    case 'admin':
    case 'super_admin':
      return '/admin/dashboard';
    case UserRole.FOUNDER:
    case 'founder':
      return '/dashboard/home'; // Founder-specific dashboard
    case UserRole.VC:
    case 'vc':
      return '/vc/dashboard';
    case UserRole.VC_PENDING:
    case 'vc_pending':
      return '/vc/pending';
    default:
      // Default to founder dashboard for any unknown role
      return '/dashboard/home';
  }
};

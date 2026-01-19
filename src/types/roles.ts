// Role enum - single source of truth for all role values
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
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

  // Cast to UserRole for consistent comparison (works because enum values are strings)
  const role = userRole as UserRole;

  // Super admin has access to both SUPER_ADMIN and ADMIN routes
  if (role === UserRole.SUPER_ADMIN) {
    return (
      allowedRoles.includes(UserRole.SUPER_ADMIN) ||
      allowedRoles.includes(UserRole.ADMIN)
    );
  }

  // Admin only matches ADMIN (not SUPER_ADMIN-only routes)
  if (role === UserRole.ADMIN) {
    return allowedRoles.includes(UserRole.ADMIN);
  }

  // All other roles: direct match
  return allowedRoles.includes(role);
};

// Get default route for role
export const getRoleDefaultRoute = (role: UserRole | string | undefined): string => {
  // Default to founder dashboard for missing/invalid roles
  if (!role || role === 'no-role' || role === '') {
    return '/dashboard/home';
  }

  // Cast to UserRole for switch statement (enum values are string literals)
  const normalizedRole = role as UserRole;

  switch (normalizedRole) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return '/admin/dashboard';
    case UserRole.FOUNDER:
      return '/dashboard/home';
    case UserRole.VC:
      return '/vc/dashboard';
    case UserRole.VC_PENDING:
      return '/vc/pending';
    default:
      return '/dashboard/home';
  }
};

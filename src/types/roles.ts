// Role enum
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FOUNDER = 'founder',
  VC = 'vc',
  VC_PENDING = 'vc_pending',
}

// Permission helper
export const hasAccess = (
  userRole: UserRole | undefined,
  allowedRoles: UserRole[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

// Get default route for role
export const getRoleDefaultRoute = (role: UserRole | string): string => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/admin/dashboard';
    case UserRole.FOUNDER:
      return '/dashboard';
    case UserRole.VC:
      return '/vc/dashboard';
    case UserRole.VC_PENDING:
      return '/vc/pending';
    default:
      return '/';
  }
};

type RoleLike =
  | string
  | {
      name?: string;
      roleName?: string;
    }
  | null
  | undefined;

export const AUTH_ROLES = {
  ADMIN: 'ADMIN',
  HOUSEKEEPER: 'HOUSEKEEPER',
  CUSTOMER: 'CUSTOMER',
} as const;

export const ROLE_ID_BY_NAME: Record<string, number> = {
  [AUTH_ROLES.ADMIN]: 1,
  [AUTH_ROLES.CUSTOMER]: 2,
  [AUTH_ROLES.HOUSEKEEPER]: 3,
};

export const ROLE_LABEL_BY_NAME: Record<string, string> = {
  [AUTH_ROLES.ADMIN]: 'Quản trị viên',
  [AUTH_ROLES.HOUSEKEEPER]: 'Người nội trợ',
  [AUTH_ROLES.CUSTOMER]: 'Thành viên',
};

export const getAuthRoleName = (userOrRole: RoleLike | { role?: RoleLike; roleName?: string }): string => {
  let roleValue: RoleLike = userOrRole as RoleLike;

  if (typeof userOrRole === 'object' && userOrRole !== null && 'role' in userOrRole) {
    roleValue = userOrRole.role ?? userOrRole.roleName;
  }

  if (typeof roleValue === 'object' && roleValue !== null) {
    return String(roleValue.name ?? roleValue.roleName ?? '').toUpperCase();
  }

  return String(roleValue ?? '').toUpperCase();
};

export const isAdminRole = (userOrRole: RoleLike | { role?: RoleLike; roleName?: string }): boolean => {
  return getAuthRoleName(userOrRole) === AUTH_ROLES.ADMIN;
};

export const isKnownUserRole = (userOrRole: RoleLike | { role?: RoleLike; roleName?: string }): boolean => {
  const roleName = getAuthRoleName(userOrRole);
  return roleName === AUTH_ROLES.HOUSEKEEPER || roleName === AUTH_ROLES.CUSTOMER;
};

export const getRoleId = (roleName: string): number => ROLE_ID_BY_NAME[getAuthRoleName(roleName)] ?? ROLE_ID_BY_NAME[AUTH_ROLES.CUSTOMER];

export const getRoleLabel = (userOrRole: RoleLike | { role?: RoleLike; roleName?: string }): string => {
  const roleName = getAuthRoleName(userOrRole);
  return ROLE_LABEL_BY_NAME[roleName] ?? ROLE_LABEL_BY_NAME[AUTH_ROLES.CUSTOMER];
};

export const getAuthRedirectPath = (userOrRole: RoleLike | { role?: RoleLike; roleName?: string }): string => {
  return isAdminRole(userOrRole) ? '/admin/users' : '/family';
};

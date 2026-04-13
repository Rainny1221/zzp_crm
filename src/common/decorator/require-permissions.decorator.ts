import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

const PERMISSION_SCOPES = new Set(['GLOBAL', 'OWN', 'ALL']);

export interface PermissionRequirement {
  permission: string;
  scope?: string;
}

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const RequirePermissions = (
  permissionOrResource: string,
  actionOrScope?: string,
) => {
  const isScope = actionOrScope
    ? PERMISSION_SCOPES.has(actionOrScope.toUpperCase())
    : false;

  const metadata: PermissionRequirement = {
    permission:
      actionOrScope && !isScope
        ? `${permissionOrResource}_${actionOrScope}`
        : permissionOrResource,
    scope: isScope ? actionOrScope : undefined,
  };

  return SetMetadata(PERMISSIONS_KEY, metadata);
};

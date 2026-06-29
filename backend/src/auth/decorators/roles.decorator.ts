import { SetMetadata } from '@nestjs/common';
import { Permission, RoleKey } from '../role-keys';

export const ROLES_KEY = 'roleKeys';
export const Roles = (...keys: RoleKey[]) => SetMetadata(ROLES_KEY, keys);

export const PERMISSION_KEY = 'permissions';
export const RequirePermission = (...perms: Permission[]) => SetMetadata(PERMISSION_KEY, perms);

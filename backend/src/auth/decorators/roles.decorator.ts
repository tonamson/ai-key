import { SetMetadata } from '@nestjs/common';
import { Permission } from '../role-keys';

export const PERMISSION_KEY = 'permissions';
export const RequirePermission = (...perms: Permission[]) => SetMetadata(PERMISSION_KEY, perms);

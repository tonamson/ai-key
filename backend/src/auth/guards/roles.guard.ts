import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission, Permission, RoleKey } from '../role-keys';
import { PERMISSION_KEY, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const { user } = ctx.switchToHttp().getRequest();

    // --- @RequirePermission('admin:all') ---
    const requiredPerms = this.reflector.getAllAndOverride<Permission[]>(PERMISSION_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (requiredPerms?.length) {
      const ok = requiredPerms.some(p => hasPermission(user?.roleKey, p));
      if (!ok) throw new ForbiddenException('Không có quyền truy cập');
      return true;
    }

    // --- @Roles('super_admin', 'manager') — kiểm tra roleKey trực tiếp (backward compat) ---
    const requiredKeys = this.reflector.getAllAndOverride<RoleKey[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredKeys?.length) return true;
    if (!user?.roleKey || !requiredKeys.includes(user.roleKey)) {
      throw new ForbiddenException('Không có quyền truy cập');
    }
    return true;
  }
}

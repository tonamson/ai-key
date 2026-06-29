import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission, Permission } from '../role-keys';
import { PERMISSION_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const { user } = ctx.switchToHttp().getRequest();

    const requiredPerms = this.reflector.getAllAndOverride<Permission[]>(PERMISSION_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredPerms?.length) return true; // route không gắn @RequirePermission — JwtAuthGuard đã chặn auth

    if (!requiredPerms.some(p => hasPermission(user?.roleKey, p))) {
      throw new ForbiddenException('Không có quyền truy cập');
    }
    return true;
  }
}

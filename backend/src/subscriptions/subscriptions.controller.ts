import { Body, Controller, Get, Param, Patch, Post, Request, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post(':id/refresh-key')
  refreshKey(@Param('id') id: string, @Request() req: any) {
    return this.service.refreshKey(id, req.user.id);
  }

  @Get('my')
  async findMine(@Request() req: any) {
    const subs = await this.service.findMine(req.user.id);
    return subs.map(s => ({
      ...s,
      nineRouterKeyMasked: s.nineRouterKey ? s.nineRouterKey.substring(0, 12) + '•••' : null,
      nineRouterKey: s.nineRouterKey,
    }));
  }
}

@RequirePermission('admin:all')
@Controller('admin/subscriptions')
export class SubscriptionsAdminController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { tokenQuota?: number; expiresAt?: string; tokenUsed?: number }) {
    return this.service.updateByAdmin(id, {
      tokenQuota: body.tokenQuota,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      tokenUsed: body.tokenUsed,
    });
  }

  @Post(':id/reset-period')
  resetPeriod(@Param('id') id: string) {
    return this.service.resetPeriod(id);
  }
}

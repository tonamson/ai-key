import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Request, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

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
    return subs.map(s => {
      const q = this.service.getQuotaInfo(s);
      const used = Number(s.tokenUsed);
      const quota = Number(s.tokenQuota);
      const usedPct = quota > 0 ? Math.min(100, Math.round(used / quota * 100)) : 0;
      return {
        id: s.id,
        isActive: s.isActive,
        autoRenew: s.autoRenew,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        planId: s.planId,
        order: s.order,
        nineRouterKeyMasked: s.nineRouterKey ? s.nineRouterKey.substring(0, 12) + '•••' : null,
        nineRouterKey: s.nineRouterKey,
        tokenUsedPct: usedPct,
        tokenRemainingPct: Math.max(0, 100 - usedPct),
        limitPeriod: q.limitPeriod,
        remainingPeriod: q.remainingPeriod,
        resetAt: q.resetAt,
      };
    });
  }
}

@RequirePermission('admin:all')
@Controller('admin/subscriptions')
export class SubscriptionsAdminController {
  constructor(
    private readonly service: SubscriptionsService,
    private readonly lifecycle: SubscriptionLifecycleService,
  ) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateSubscriptionDto) {
    return this.service.updateByAdmin(id, {
      tokenQuota: body.tokenQuota,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      tokenUsed: body.tokenUsed,
      isActive: body.isActive,
      autoRenew: body.autoRenew,
      planId: body.planId,
    });
  }

  @Post(':id/reset-period')
  resetPeriod(@Param('id') id: string) {
    return this.service.resetPeriod(id);
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    const sub = await this.service.findById(id);
    if (!sub) throw new NotFoundException('Subscription không tồn tại');
    await this.lifecycle.deactivateSub(sub);
    return { success: true };
  }
}

import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { TopupService } from './topup.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('topup')
export class TopupController {
  constructor(private readonly svc: TopupService) {}

  @Post()
  create(@Request() req: any, @Body() body: { amount: number }) {
    return this.svc.create(req.user.id, body.amount);
  }

  @Get('my')
  mine(@Request() req: any) {
    return this.svc.getMyTopups(req.user.id);
  }
}

@Controller('admin/topup')
export class AdminTopupController {
  constructor(private readonly svc: TopupService) {}

  @Get()
  @RequirePermission('users:manage')
  findAll() { return this.svc.findAll(); }

  @Post(':id/approve')
  @RequirePermission('users:manage')
  approve(@Param('id') id: string, @Body() body: { note?: string }) {
    return this.svc.approve(id, body.note);
  }

  @Post(':id/reject')
  @RequirePermission('users:manage')
  reject(@Param('id') id: string) {
    return this.svc.reject(id);
  }
}

/** Webhook nhận callback từ Telegram inline button — Public vì Telegram gọi không có token */
@Controller('telegram')
export class TelegramWebhookController {
  constructor(private readonly svc: TopupService) {}

  @Public()
  @Post('webhook')
  async webhook(@Body() body: any) {
    const cq = body?.callback_query;
    if (cq?.data) {
      await this.svc.handleCallback(cq.id, cq.data);
    }
    return { ok: true };
  }
}

import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { TopupService } from './topup.service';
import { OrdersService } from '../orders/orders.service';
import { TelegramService } from '../telegram/telegram.service';
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
  constructor(
    private readonly topup: TopupService,
    private readonly orders: OrdersService,
    private readonly telegram: TelegramService,
  ) {}

  @Public()
  @Post('webhook')
  async webhook(@Body() body: any) {
    const cq = body?.callback_query;
    if (!cq?.data) return { ok: true };

    const [action, id] = cq.data.split(':');

    if (action === 'topup_approve' || action === 'topup_reject') {
      await this.topup.handleCallback(cq.id, cq.data);
    } else if (action === 'order_approve') {
      try {
        await this.orders.confirmOrder(id);
        await this.telegram.answerCallbackQuery(cq.id, '✅ Đã duyệt đơn hàng');
      } catch (e: any) {
        await this.telegram.answerCallbackQuery(cq.id, `❌ ${e?.message ?? 'Lỗi'}`);
      }
    } else if (action === 'order_cancel') {
      try {
        await this.orders.cancelOrder(id);
        await this.telegram.answerCallbackQuery(cq.id, '❌ Đã huỷ đơn hàng');
      } catch (e: any) {
        await this.telegram.answerCallbackQuery(cq.id, `❌ ${e?.message ?? 'Lỗi'}`);
      }
    }

    return { ok: true };
  }
}

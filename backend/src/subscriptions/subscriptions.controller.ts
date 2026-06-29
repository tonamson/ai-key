import { Controller, Get, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get('my')
  async findMine(@Request() req: any) {
    const subs = await this.service.findMine(req.user.sub);
    return subs.map(s => ({
      ...s,
      nineRouterKey: s.nineRouterKey ? s.nineRouterKey.substring(0, 12) + '***' : null,
    }));
  }
}

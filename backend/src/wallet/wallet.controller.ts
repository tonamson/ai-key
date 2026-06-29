import { Body, Controller, Get, Param, Post, Query, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';

@Controller('wallet')
export class WalletController {
  constructor(private readonly svc: WalletService) {}

  @Get('me')
  async getMyWallet(@Request() req: any) {
    const balance = await this.svc.getBalance(req.user.id);
    const history = await this.svc.getHistory(req.user.id);
    return { balance, history };
  }
}

@Controller('admin/wallet')
export class AdminWalletController {
  constructor(private readonly svc: WalletService) {}

  @Post(':userId/adjust')
  @RequirePermission('users:manage')
  adjust(@Param('userId') userId: string, @Body() body: { amount: number; note: string }) {
    return this.svc.adminAdjust(userId, body.amount, body.note);
  }

  @Get(':userId/history')
  @RequirePermission('users:manage')
  history(@Param('userId') userId: string) {
    return this.svc.getHistory(userId);
  }

  @Get()
  @RequirePermission('users:manage')
  all(@Query('userId') userId?: string) {
    return this.svc.getAllHistory(userId);
  }
}

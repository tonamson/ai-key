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

  /** Trả về VietQR URL để nạp ví. Nội dung CK = userId (dùng để đối soát). */
  @Get('topup-qr')
  getTopupQr(@Request() req: any, @Query('amount') amount?: string) {
    const userId = req.user.id as string;
    // Lấy 8 ký tự cuối UUID làm memo ngắn gọn, dễ đối soát
    const memo = userId.replace(/-/g, '').slice(-8).toUpperCase();
    const base = 'https://img.vietqr.io/image/TECHCOMBANK-19032009391010-compact.png';
    const params = new URLSearchParams({ addInfo: memo });
    if (amount) params.set('amount', amount);
    return { qrUrl: `${base}?${params}`, memo, userId };
  }
}

@Controller('admin/wallet')
export class AdminWalletController {
  constructor(private readonly svc: WalletService) {}

  @Post(':userId/adjust')
  @RequirePermission('users:manage')
  adjust(@Param('userId') userId: string, @Body() body: { amount: number; note: string; source?: 'vietqr' | 'manual' }) {
    const note = body.source === 'vietqr'
      ? `[VietQR] ${body.note ?? ''} | userId:${userId}`.trim()
      : (body.note ?? 'Admin điều chỉnh');
    return this.svc.adminAdjust(userId, body.amount, note);
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

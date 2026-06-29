import { Controller, Get, Request } from '@nestjs/common';
import { ReferralService } from './referral.service';

@Controller('referrals')
export class ReferralController {
  constructor(private readonly service: ReferralService) {}

  @Get('my-code')
  async getMyCode(@Request() req: any) {
    return this.service.getOrCreate(req.user.id);
  }
}

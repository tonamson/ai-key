import { Controller, Get, Request } from '@nestjs/common';
import { ReferralService } from './referral.service';

@Controller('referral')
export class ReferralController {
  constructor(private readonly service: ReferralService) {}

  @Get('my-code')
  getMyCode(@Request() req: any) {
    return this.service.getMyCode(req.user.sub);
  }
}

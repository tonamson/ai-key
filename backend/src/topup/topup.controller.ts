import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { TopupService } from './topup.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';

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

import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@RequirePermission('admin:all')
@Controller('admin/coupons')
export class CouponsAdminController {
  constructor(private readonly service: CouponsService) {}

  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() dto: CreateCouponDto) { return this.service.create(dto as any); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCouponDto) { return this.service.update(id, dto as any); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}

@Public()
@Controller('coupons')
export class CouponsPublicController {
  constructor(private readonly service: CouponsService) {}

  @Post('validate') @HttpCode(200) validate(@Body('code') code: string) { return this.service.validate(code); }
}

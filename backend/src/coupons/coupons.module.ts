import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './coupon.entity';
import { CouponsService } from './coupons.service';
import { CouponsAdminController, CouponsPublicController } from './coupons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon])],
  controllers: [CouponsAdminController, CouponsPublicController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}

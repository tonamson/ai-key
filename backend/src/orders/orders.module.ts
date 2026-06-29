import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { KeySubscription } from '../subscriptions/key-subscription.entity';
import { OrdersService } from './orders.service';
import { OrdersController, OrdersAdminController } from './orders.controller';
import { PlansModule } from '../plans/plans.module';
import { CouponsModule } from '../coupons/coupons.module';
import { ReferralModule } from '../referral/referral.module';
import { NineRouterModule } from '../nine-router/nine-router.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, KeySubscription]),
    PlansModule,
    CouponsModule,
    ReferralModule,
    NineRouterModule,
  ],
  controllers: [OrdersController, OrdersAdminController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

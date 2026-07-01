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
import { WalletModule } from '../wallet/wallet.module';
import { EmailModule } from '../email/email.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, KeySubscription]),
    PlansModule,
    CouponsModule,
    ReferralModule,
    NineRouterModule,
    WalletModule,
    EmailModule,
    TelegramModule,
  ],
  controllers: [OrdersController, OrdersAdminController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

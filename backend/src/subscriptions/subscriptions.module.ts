import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeySubscription } from './key-subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController, SubscriptionsAdminController } from './subscriptions.controller';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { NineRouterModule } from '../nine-router/nine-router.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { PlansModule } from '../plans/plans.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeySubscription]),
    NineRouterModule,
    NotificationsModule,
    EmailModule,
    PlansModule,
    WalletModule,
  ],
  controllers: [SubscriptionsController, SubscriptionsAdminController],
  providers: [SubscriptionsService, SubscriptionLifecycleService],
  exports: [SubscriptionsService, SubscriptionLifecycleService],
})
export class SubscriptionsModule {}

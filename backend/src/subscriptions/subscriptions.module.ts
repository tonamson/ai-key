import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeySubscription } from './key-subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController, SubscriptionsAdminController } from './subscriptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KeySubscription])],
  controllers: [SubscriptionsController, SubscriptionsAdminController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

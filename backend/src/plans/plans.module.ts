import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './plan.entity';
import { KeySubscription } from '../subscriptions/key-subscription.entity';
import { PlansService } from './plans.service';
import { PlansAdminController, PlansPublicController } from './plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, KeySubscription])],
  controllers: [PlansAdminController, PlansPublicController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}

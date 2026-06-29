import { Module } from '@nestjs/common';
import { ClaudeProxyService } from './claude-proxy.service';
import { ClaudeProxyController } from './claude-proxy.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [SubscriptionsModule, StatsModule],
  controllers: [ClaudeProxyController],
  providers: [ClaudeProxyService],
})
export class ClaudeProxyModule {}

import { Module } from '@nestjs/common';
import { ClaudeProxyService } from './claude-proxy.service';
import { ClaudeProxyController } from './claude-proxy.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [ClaudeProxyController],
  providers: [ClaudeProxyService],
})
export class ClaudeProxyModule {}

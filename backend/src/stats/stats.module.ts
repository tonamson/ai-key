import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenUsageLog } from './token-usage-log.entity';
import { Order } from '../orders/order.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TokenUsageLog, Order])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}

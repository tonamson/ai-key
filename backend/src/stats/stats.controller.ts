import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { Granularity } from './stats.service';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequirePermission } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@RequirePermission('admin:all')
@Controller('admin/stats')
export class StatsController {
  constructor(private stats: StatsService) {}

  @Get('summary')
  summary(@Query('from') from: string, @Query('to') to: string) {
    return this.stats.getSummary(new Date(from), new Date(to));
  }

  @Get('revenue')
  revenue(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('granularity') granularity: Granularity = 'day',
  ) {
    return this.stats.getRevenue(new Date(from), new Date(to), granularity);
  }

  @Get('tokens')
  tokens(@Query('from') from: string, @Query('to') to: string) {
    return this.stats.getTokenUsageByHour(new Date(from), new Date(to));
  }
}

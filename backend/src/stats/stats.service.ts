import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenUsageLog } from './token-usage-log.entity';
import { Order, OrderStatus } from '../orders/order.entity';

export type Granularity = 'day' | 'week' | 'month';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(TokenUsageLog) private tokenRepo: Repository<TokenUsageLog>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async logTokenUsage(subscriptionId: string, userId: string, inputTokens: number, outputTokens: number) {
    await this.tokenRepo.insert({ subscriptionId, userId, inputTokens, outputTokens });
  }

  async getRevenue(from: Date, to: Date, granularity: Granularity) {
    const trunc = granularity === 'month' ? 'month' : granularity === 'week' ? 'week' : 'day';
    const rows = await this.orderRepo.query(`
      SELECT
        DATE_TRUNC('${trunc}', "paidAt") AS period,
        COUNT(*)::int AS orders,
        SUM("finalPrice")::bigint AS revenue
      FROM orders
      WHERE status = 'paid'
        AND "paidAt" >= $1 AND "paidAt" < $2
      GROUP BY 1
      ORDER BY 1
    `, [from, to]);
    return rows.map((r: any) => ({
      period: r.period,
      orders: r.orders,
      revenue: Number(r.revenue),
    }));
  }

  async getTokenUsageByHour(from: Date, to: Date) {
    const rows = await this.tokenRepo.query(`
      SELECT
        DATE_TRUNC('hour', "createdAt") AS hour,
        SUM("inputTokens")::bigint AS input,
        SUM("outputTokens")::bigint AS output
      FROM token_usage_logs
      WHERE "createdAt" >= $1 AND "createdAt" < $2
      GROUP BY 1
      ORDER BY 1
    `, [from, to]);
    return rows.map((r: any) => ({
      hour: r.hour,
      input: Number(r.input),
      output: Number(r.output),
    }));
  }

  async getSummary(from: Date, to: Date) {
    const [revenueRow] = await this.orderRepo.query(`
      SELECT
        COUNT(*)::int AS orders,
        COALESCE(SUM("finalPrice"), 0)::bigint AS revenue
      FROM orders
      WHERE status = 'paid' AND "paidAt" >= $1 AND "paidAt" < $2
    `, [from, to]);

    const [tokenRow] = await this.tokenRepo.query(`
      SELECT
        COALESCE(SUM("inputTokens"), 0)::bigint AS input,
        COALESCE(SUM("outputTokens"), 0)::bigint AS output
      FROM token_usage_logs
      WHERE "createdAt" >= $1 AND "createdAt" < $2
    `, [from, to]);

    return {
      orders: revenueRow.orders,
      revenue: Number(revenueRow.revenue),
      inputTokens: Number(tokenRow.input),
      outputTokens: Number(tokenRow.output),
    };
  }
}

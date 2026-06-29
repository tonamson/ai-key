import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeySubscription } from './key-subscription.entity';

// Hourly window in ms — rolling from key creation time
const PERIOD_WINDOW_MS = 60 * 60 * 1000;

export interface QuotaInfo {
  limitTotal: number;
  remainingTotal: number;
  limitPeriod: number;
  remainingPeriod: number;
  resetAt: Date;
}

@Injectable()
export class SubscriptionsService {
  constructor(@InjectRepository(KeySubscription) private readonly repo: Repository<KeySubscription>) {}

  findMine(userId: string) {
    return this.repo.find({
      where: { userId, isActive: true },
      relations: { order: { plan: true } },
      order: { expiresAt: 'DESC' },
    });
  }

  findAll() {
    return this.repo.find({
      relations: { user: true, order: { plan: true } },
      order: { createdAt: 'DESC' },
    });
  }

  findActiveByKey(nineRouterKey: string): Promise<KeySubscription | null> {
    return this.repo.findOne({ where: { nineRouterKey, isActive: true } });
  }

  getQuotaInfo(sub: KeySubscription): QuotaInfo {
    const limitTotal = Number(sub.tokenQuota);
    const limitPeriod = Math.floor(limitTotal / 720); // ~1 month / 720 hours
    const now = Date.now();

    // advance periodStartsAt until it's the current window start
    let windowStart = sub.periodStartsAt.getTime();
    while (windowStart + PERIOD_WINDOW_MS <= now) windowStart += PERIOD_WINDOW_MS;

    // tokenUsedPeriod is valid for current window; reset happened in deductTokens
    const usedPeriod = Number(sub.tokenUsedPeriod);

    return {
      limitTotal,
      remainingTotal: Math.max(0, limitTotal - Number(sub.tokenUsed)),
      limitPeriod,
      remainingPeriod: Math.max(0, limitPeriod - usedPeriod),
      resetAt: new Date(windowStart + PERIOD_WINDOW_MS),
    };
  }

  async updateByAdmin(id: string, data: { tokenQuota?: number; expiresAt?: Date; tokenUsed?: number }) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription không tồn tại');
    if (data.tokenQuota !== undefined) sub.tokenQuota = data.tokenQuota;
    if (data.expiresAt !== undefined) sub.expiresAt = data.expiresAt;
    if (data.tokenUsed !== undefined) sub.tokenUsed = data.tokenUsed;
    return this.repo.save(sub);
  }

  async resetPeriod(id: string) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription không tồn tại');
    sub.tokenUsedPeriod = 0;
    sub.periodStartsAt = new Date();
    return this.repo.save(sub);
  }

  async deductTokens(id: string, inputTokens: number, outputTokens: number): Promise<QuotaInfo> {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription không tồn tại');

    const delta = inputTokens + outputTokens;
    const now = Date.now();

    // Roll period window forward if expired
    let windowStart = sub.periodStartsAt.getTime();
    let rolled = false;
    while (windowStart + PERIOD_WINDOW_MS <= now) {
      windowStart += PERIOD_WINDOW_MS;
      rolled = true;
    }
    if (rolled) {
      sub.periodStartsAt = new Date(windowStart);
      sub.tokenUsedPeriod = 0;
    }

    sub.tokenUsed = Number(sub.tokenUsed) + delta;
    sub.tokenUsedPeriod = Number(sub.tokenUsedPeriod) + delta;
    await this.repo.save(sub);

    return this.getQuotaInfo(sub);
  }
}

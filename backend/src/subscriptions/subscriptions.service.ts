import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { KeySubscription } from './key-subscription.entity';

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

  findActiveByKey(nineRouterKey: string): Promise<KeySubscription | null> {
    return this.repo.findOne({ where: { nineRouterKey, isActive: true } });
  }

  async deductTokens(id: string, inputTokens: number, outputTokens: number): Promise<number> {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription không tồn tại');
    sub.tokenUsed = Number(sub.tokenUsed) + inputTokens + outputTokens;
    await this.repo.save(sub);
    return Number(sub.tokenQuota) - Number(sub.tokenUsed);
  }
}

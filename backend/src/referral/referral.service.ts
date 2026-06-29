import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralCode } from './referral-code.entity';

@Injectable()
export class ReferralService {
  constructor(@InjectRepository(ReferralCode) private readonly repo: Repository<ReferralCode>) {}

  async generateCode(userId: string): Promise<ReferralCode> {
    let code: string;
    let exists: ReferralCode | null;
    do {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      exists = await this.repo.findOne({ where: { code } });
    } while (exists);
    return this.repo.save(this.repo.create({ userId, code }));
  }

  async getMyCode(userId: string): Promise<ReferralCode | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async findByCode(code: string): Promise<ReferralCode | null> {
    return this.repo.findOne({ where: { code } });
  }

  async creditCommission(code: string, orderAmount: number): Promise<void> {
    const ref = await this.repo.findOne({ where: { code } });
    if (!ref) return;
    ref.totalEarned = Number(ref.totalEarned) + orderAmount * (Number(ref.commissionPercent) / 100);
    await this.repo.save(ref);
  }
}

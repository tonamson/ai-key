import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralCode } from './referral-code.entity';
import { SystemConfigService } from '../system-config/system-config.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(ReferralCode) private readonly repo: Repository<ReferralCode>,
    private readonly systemConfig: SystemConfigService,
  ) {}

  async generateCode(userId: string): Promise<ReferralCode> {
    let code: string;
    let exists: ReferralCode | null;
    do {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      exists = await this.repo.findOne({ where: { code } });
    } while (exists);
    return this.repo.save(this.repo.create({ userId, code }));
  }

  async getOrCreate(userId: string): Promise<ReferralCode> {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) return existing;
    return this.generateCode(userId);
  }

  async getMyCode(userId: string): Promise<ReferralCode | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async findByCode(code: string): Promise<ReferralCode | null> {
    return this.repo.findOne({ where: { code } });
  }

  /** Credit hoa hồng: cộng totalEarned (thống kê) + cộng ví (dùng được) */
  async creditCommission(referralCode: string, orderAmount: number, orderId: string, wallet: WalletService): Promise<void> {
    const ref = await this.repo.findOne({ where: { code: referralCode } });
    if (!ref) return;
    const pct = await this.systemConfig.getNumber('referral_commission_percent', 10);
    const commission = Math.floor(orderAmount * (pct / 100));
    if (commission <= 0) return;
    await wallet.creditCommission(ref.userId, commission, orderId);
    ref.totalEarned = Number(ref.totalEarned) + commission;
    await this.repo.save(ref);
  }
}

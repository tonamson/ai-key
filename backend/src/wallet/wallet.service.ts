import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WalletTransaction, WalletTxType } from './wallet-transaction.entity';
import { User } from '../users/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletTransaction) private readonly txRepo: Repository<WalletTransaction>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const u = await this.users.findOneBy({ id: userId });
    return Number(u?.walletBalance ?? 0);
  }

  async getHistory(userId: string) {
    return this.txRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async getAllHistory(userId?: string) {
    return this.txRepo.find({
      where: userId ? { userId } : {},
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  /** Cộng hoa hồng vào ví (chỉ gọi khi F1 thanh toán QR thật) */
  async creditCommission(userId: string, amount: number, orderId: string): Promise<void> {
    if (amount <= 0) return;
    await this.dataSource.transaction(async em => {
      await em.increment(User, { id: userId }, 'walletBalance', amount);
      await em.save(WalletTransaction, em.create(WalletTransaction, {
        userId, amount, type: WalletTxType.COMMISSION,
        description: 'Hoa hồng giới thiệu', orderId,
      }));
    });
  }

  /** Trừ ví khi dùng để mua key, trả về số thực tế trừ được */
  async spendForOrder(userId: string, requestAmount: number, orderId: string): Promise<number> {
    const balance = await this.getBalance(userId);
    const spend = Math.min(requestAmount, balance);
    if (spend <= 0) return 0;
    await this.dataSource.transaction(async em => {
      const u = await em.findOneOrFail(User, { where: { id: userId } });
      const current = Number(u.walletBalance);
      if (current < spend) throw new BadRequestException('Số dư ví không đủ');
      await em.decrement(User, { id: userId }, 'walletBalance', spend);
      await em.save(WalletTransaction, em.create(WalletTransaction, {
        userId, amount: -spend, type: WalletTxType.SPEND,
        description: 'Thanh toán đơn hàng bằng ví', orderId,
      }));
    });
    return spend;
  }

  /** Admin nạp/trừ thủ công */
  async adminAdjust(userId: string, amount: number, note: string): Promise<void> {
    const type = amount >= 0 ? WalletTxType.ADMIN_ADD : WalletTxType.ADMIN_SUB;
    await this.dataSource.transaction(async em => {
      if (amount >= 0) {
        await em.increment(User, { id: userId }, 'walletBalance', amount);
      } else {
        const u = await em.findOneOrFail(User, { where: { id: userId } });
        if (Number(u.walletBalance) < Math.abs(amount)) throw new BadRequestException('Số dư không đủ để trừ');
        await em.decrement(User, { id: userId }, 'walletBalance', Math.abs(amount));
      }
      await em.save(WalletTransaction, em.create(WalletTransaction, {
        userId, amount, type, description: note, orderId: null,
      }));
    });
  }
}

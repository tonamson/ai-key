import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
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

  /**
   * Trừ đúng `amount` khỏi ví một cách atomic (conditional UPDATE chống race/double-spend).
   * Trả về true nếu trừ thành công, false nếu số dư không đủ. Không tự "trừ được bao nhiêu hay bấy nhiêu"
   * vì caller đã chốt finalPrice dựa trên amount này.
   */
  async spendForOrder(userId: string, amount: number, orderId: string, manager?: EntityManager): Promise<boolean> {
    if (amount <= 0) return true;
    const run = async (em: EntityManager): Promise<boolean> => {
      // Atomic: chỉ trừ khi đủ số dư. affected=0 nghĩa là không đủ.
      const res = await em.createQueryBuilder()
        .update(User)
        .set({ walletBalance: () => 'walletBalance - :amount' })
        .where('id = :userId AND walletBalance >= :amount', { userId, amount })
        .setParameter('amount', amount)
        .execute();
      if (!res.affected) return false;
      await em.save(WalletTransaction, em.create(WalletTransaction, {
        userId, amount: -amount, type: WalletTxType.SPEND,
        description: 'Thanh toán đơn hàng bằng ví', orderId,
      }));
      return true;
    };
    return manager ? run(manager) : this.dataSource.transaction(run);
  }

  /** Hoàn tiền ví (đơn bị huỷ/hết hạn). Atomic cộng lại đúng amount. */
  async refund(userId: string, amount: number, orderId: string, manager?: EntityManager): Promise<void> {
    if (amount <= 0) return;
    const run = async (em: EntityManager) => {
      await em.increment(User, { id: userId }, 'walletBalance', amount);
      await em.save(WalletTransaction, em.create(WalletTransaction, {
        userId, amount, type: WalletTxType.REFUND,
        description: 'Hoàn tiền đơn hàng bị huỷ', orderId,
      }));
    };
    return manager ? run(manager) : this.dataSource.transaction(run);
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

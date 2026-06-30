import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { KeySubscription } from './key-subscription.entity';
import { NineRouterService } from '../nine-router/nine-router.service';
import { WalletService } from '../wallet/wallet.service';
import { PlansService } from '../plans/plans.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { NotificationType } from '../notifications/notification.entity';
import { User } from '../users/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionLifecycleService {
  private readonly logger = new Logger(SubscriptionLifecycleService.name);

  constructor(
    @InjectRepository(KeySubscription) private readonly subRepo: Repository<KeySubscription>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly nineRouter: NineRouterService,
    private readonly wallet: WalletService,
    private readonly plans: PlansService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  /** Xóa key 9router và disable sub. Dùng khi hủy đơn hoặc admin thu hồi. */
  async deactivateSub(sub: KeySubscription): Promise<void> {
    await this.nineRouter.deleteKey(sub.nineRouterKeyId).catch(e =>
      this.logger.warn(`deleteKey ${sub.nineRouterKeyId} failed: ${e.message}`));
    sub.isActive = false;
    sub.autoRenew = false;
    await this.subRepo.save(sub);
  }

  /** Mỗi giờ: deactivate các sub đã hết hạn */
  @Cron('0 * * * *')
  async expireSubscriptions(): Promise<void> {
    const expired = await this.subRepo.find({
      where: { isActive: true, expiresAt: LessThan(new Date()) },
      take: 200,
    });
    for (const sub of expired) {
      await this.deactivateSub(sub).catch(e =>
        this.logger.error(`expireSub ${sub.id}: ${e.message}`));
    }
  }

  /** Mỗi ngày lúc 8h: check sub còn ≤3 ngày, autoRenew=true → trừ ví hoặc cảnh báo */
  @Cron('0 8 * * *')
  async processAutoRenew(): Promise<void> {
    const soon = new Date(Date.now() + THREE_DAYS_MS);
    const subs = await this.subRepo.find({
      where: { isActive: true, autoRenew: true, expiresAt: LessThanOrEqual(soon) },
      relations: { user: true },
      take: 500,
    });

    for (const sub of subs) {
      await this.tryRenewOrNotify(sub).catch(e =>
        this.logger.error(`autoRenew ${sub.id}: ${e.message}`));
    }
  }

  private async tryRenewOrNotify(sub: KeySubscription): Promise<void> {
    const planId = sub.planId;
    if (!planId) return;

    const plan = await this.plans.findOne(planId).catch(() => null);
    if (!plan || !plan.isActive) return;

    const price = Number(plan.price);
    const balance = await this.wallet.getBalance(sub.userId);
    const daysLeft = Math.ceil((sub.expiresAt.getTime() - Date.now()) / 86400000);

    if (balance >= price) {
      // Đủ tiền → trừ ví + gia hạn cộng dồn
      const ok = await this.wallet.spendForOrder(sub.userId, price, sub.id);
      if (!ok) return this.notifyInsufficient(sub, daysLeft);

      const addedMs = plan.durationDays * 86400000;
      const base = sub.expiresAt.getTime() > Date.now() ? sub.expiresAt.getTime() : Date.now();
      sub.expiresAt = new Date(base + addedMs);
      sub.tokenQuota = Number(sub.tokenQuota) + Number(plan.tokenQuota);
      sub.isActive = true;
      await this.subRepo.save(sub);

      this.logger.log(`Auto-renewed sub ${sub.id} for user ${sub.userId}`);
      await this.notifications.create({
        userId: sub.userId,
        type: NotificationType.REMINDER,
        title: 'Gia hạn tự động thành công',
        body: `Key của bạn đã được gia hạn thêm ${plan.durationDays} ngày.`,
      });
    } else {
      await this.notifyInsufficient(sub, daysLeft);
    }
  }

  private async notifyInsufficient(sub: KeySubscription, daysLeft: number): Promise<void> {
    const user = sub.user ?? await this.dataSource.getRepository(User).findOneBy({ id: sub.userId });
    if (!user) return;

    await this.notifications.create({
      userId: sub.userId,
      type: NotificationType.REMINDER,
      title: `Key sắp hết hạn trong ${daysLeft} ngày`,
      body: 'Số dư ví không đủ để tự động gia hạn. Vui lòng nạp thêm tiền.',
      link: '/dashboard/wallet',
    });

    if (user.email) {
      await this.email.sendSubscriptionExpiring(user.email, user.name, daysLeft);
    }
  }
}

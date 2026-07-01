import { randomBytes } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThan, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { User } from '../users/user.entity';
import { KeySubscription } from '../subscriptions/key-subscription.entity';
import { PlansService } from '../plans/plans.service';
import { CouponsService } from '../coupons/coupons.service';
import { ReferralService } from '../referral/referral.service';
import { NineRouterService } from '../nine-router/nine-router.service';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';
import { DiscountType } from '../coupons/coupon.entity';
import { CreateOrderDto } from './dto/create-order.dto';

const VIETQR_BASE = 'https://img.vietqr.io/image/TECHCOMBANK-19032009391010-compact.png';
// Đơn chưa thanh toán tự huỷ sau 24h. ponytail: hardcode — chuyển sang system_config nếu cần chỉnh runtime.
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(KeySubscription) private readonly subRepo: Repository<KeySubscription>,
    private readonly plans: PlansService,
    private readonly coupons: CouponsService,
    private readonly referral: ReferralService,
    private readonly nineRouter: NineRouterService,
    private readonly wallet: WalletService,
    private readonly email: EmailService,
    private readonly telegram: TelegramService,
  ) {}

  private readonly fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  async createOrder(userId: string, dto: CreateOrderDto) {
    const plan = await this.plans.findOne(dto.planId);
    if (!plan.isActive) throw new BadRequestException('Gói này không còn khả dụng');

    // Gia hạn: phải là subscription của chính user (chống IDOR)
    let renewSubscriptionId: string | null = null;
    if (dto.renewSubscriptionId) {
      const sub = await this.subRepo.findOne({ where: { id: dto.renewSubscriptionId, userId } });
      if (!sub) throw new NotFoundException('Subscription cần gia hạn không tồn tại');
      renewSubscriptionId = sub.id;
    }

    const originalPrice = Number(plan.price);

    // Tính chiết khấu coupon (chưa reserve — reserve atomic trong transaction)
    let discountAmount = 0;
    let couponId: string | null = null;
    if (dto.couponCode) {
      const coupon = await this.coupons.validate(dto.couponCode);
      couponId = coupon.id;
      discountAmount = coupon.discountType === DiscountType.PERCENT
        ? originalPrice * (Number(coupon.discountValue) / 100)
        : Number(coupon.discountValue);
      discountAmount = Math.min(discountAmount, originalPrice);
    }

    // Số dư ví dự kiến; số trừ thực tế chốt atomic trong transaction
    let walletUsed = 0;
    if (dto.useWallet) {
      const balance = await this.wallet.getBalance(userId);
      walletUsed = Math.max(0, Math.min(balance, originalPrice - discountAmount));
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount - walletUsed);

    // Tạo đơn + reserve coupon + trừ ví trong CÙNG transaction; lỗi bất kỳ → rollback toàn bộ.
    const order = await this.orderRepo.manager.transaction(async em => {
      if (dto.couponCode) {
        await this.coupons.validateAndReserve(dto.couponCode, em); // throw nếu hết lượt
      }
      const created = await em.save(em.create(Order, {
        userId, planId: plan.id, couponId,
        originalPrice, discountAmount, walletUsed, finalPrice,
        renewSubscriptionId,
        expiresAt: new Date(Date.now() + PENDING_TTL_MS),
        transferMemo: randomBytes(16).toString('hex'),
      }));
      if (walletUsed > 0) {
        const ok = await this.wallet.spendForOrder(userId, walletUsed, created.id, em);
        if (!ok) throw new BadRequestException('Số dư ví không đủ');
      }
      return created;
    });

    const memo = order.transferMemo ?? order.id.replace(/-/g, '');
    const vietQRUrl = finalPrice > 0
      ? `${VIETQR_BASE}?amount=${finalPrice}&addInfo=${memo}`
      : '';

    // Ví cover 100% — confirm ngay không cần QR
    if (finalPrice === 0) {
      await this.confirmOrder(order.id);
      const confirmed = await this.orderRepo.findOne({ where: { id: order.id } });
      return { order: confirmed!, vietQRUrl: '' };
    }

    // Gửi Telegram thông báo chờ thanh toán
    const user = await this.orderRepo.manager.findOne(User, { where: { id: userId } });
    const expiresAt = order.expiresAt!;
    const fmtExp = expiresAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
    const text = [
      `🛒 <b>Đơn hàng mới</b>`,
      ``,
      `👤 <b>User:</b> ${user?.name ?? userId} (<code>${user?.email ?? userId}</code>)`,
      `📦 <b>Gói:</b> ${plan.name}`,
      `💵 <b>Cần CK:</b> ${this.fmt(finalPrice)}đ`,
      `🔑 <b>Mã CK:</b> <code>${memo}</code>`,
      `⏰ <b>Hết hạn lúc:</b> ${fmtExp}`,
      `🆔 <b>ID:</b> <code>${order.id}</code>`,
    ].join('\n');

    const msgId = await this.telegram.sendMessage(text, {
      inlineKeyboard: [[
        { text: '✅ Duyệt', callback_data: `order_approve:${order.id}` },
        { text: '❌ Huỷ',   callback_data: `order_cancel:${order.id}`  },
      ]],
    });
    if (msgId) {
      order.telegramMessageId = msgId;
      await this.orderRepo.save(order);
    }

    return { order, vietQRUrl };
  }

  async confirmOrder(orderId: string) {
    // Atomic claim: chỉ 1 lời gọi chuyển PENDING→PAID thành công, chống double-confirm tạo 2 key.
    const claim = await this.orderRepo.update(
      { id: orderId, status: OrderStatus.PENDING },
      { status: OrderStatus.PAID, paidAt: new Date() },
    );
    if (!claim.affected) {
      const exists = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!exists) throw new NotFoundException('Đơn hàng không tồn tại');
      throw new BadRequestException('Đơn hàng không ở trạng thái chờ');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { plan: true, user: true },
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    const now = order.paidAt ?? new Date();
    const addedMs = order.plan.durationDays * 86400000;

    if (order.renewSubscriptionId) {
      // GIA HẠN: giữ nguyên key cũ, cộng thêm thời gian + quota, kích hoạt lại nếu đã tắt.
      const sub = await this.subRepo.findOne({ where: { id: order.renewSubscriptionId, userId: order.userId } });
      if (!sub) {
        await this.orderRepo.update({ id: orderId }, { status: OrderStatus.PENDING, paidAt: null });
        throw new NotFoundException('Subscription cần gia hạn không tồn tại');
      }
      // Còn hạn thì cộng dồn từ ngày hết hạn; đã hết hạn thì tính từ bây giờ.
      const base = sub.expiresAt > now ? sub.expiresAt.getTime() : now.getTime();
      sub.expiresAt = new Date(base + addedMs);
      // Quota đã dùng hết → reset về 0 (gói mới hoàn toàn); còn quota → cộng dồn như cũ.
      const quotaExhausted = Number(sub.tokenUsed) >= Number(sub.tokenQuota);
      if (quotaExhausted) {
        sub.tokenQuota = Number(order.plan.tokenQuota);
        sub.tokenUsed = 0;
      } else {
        sub.tokenQuota = Number(sub.tokenQuota) + Number(order.plan.tokenQuota);
      }
      sub.isActive = true;
      await this.subRepo.save(sub);

      order.nineRouterKeyId = sub.nineRouterKeyId;
      order.nineRouterKey = sub.nineRouterKey;
      await this.orderRepo.save(order);
    } else {
      // MUA MỚI: tạo key (lỗi mạng → revert PENDING, tránh kẹt PAID không có key).
      let keyId: string, keyValue: string;
      try {
        ({ id: keyId, key: keyValue } = await this.nineRouter.createKey(order.user.name));
      } catch (e) {
        await this.orderRepo.update({ id: orderId }, { status: OrderStatus.PENDING, paidAt: null });
        throw e;
      }

      await this.subRepo.save(this.subRepo.create({
        userId: order.userId,
        orderId: order.id,
        planId: order.planId,
        nineRouterKeyId: keyId,
        nineRouterKey: keyValue,
        tokenQuota: order.plan.tokenQuota,
        startsAt: now,
        expiresAt: new Date(now.getTime() + addedMs),
        periodStartsAt: now,
      }));

      order.nineRouterKeyId = keyId;
      order.nineRouterKey = keyValue;
      await this.orderRepo.save(order);
    }

    // coupon usedCount đã reserve lúc tạo đơn — không tăng lại ở đây

    // Hoa hồng chỉ tính trên tiền QR thật (finalPrice), không tính phần trả bằng ví
    if (order.user.referredBy && Number(order.finalPrice) > 0) {
      await this.referral.creditCommission(order.user.referredBy, Number(order.finalPrice), order.id, this.wallet).catch(() => {});
    }

    this.email.sendOrderConfirmed(order.user.email, order.user.name, {
      planName: order.plan.name,
      apiKey: order.nineRouterKey!,
      expiresAt: order.renewSubscriptionId
        ? undefined
        : new Date(order.paidAt!.getTime() + order.plan.durationDays * 86400000),
      isRenewal: !!order.renewSubscriptionId,
    }).catch(() => {});

    // Xóa message Telegram sau khi duyệt thành công
    if (order.telegramMessageId) {
      await this.telegram.deleteMessage(order.telegramMessageId).catch(() => {});
      await this.orderRepo.update({ id: orderId }, { telegramMessageId: null });
    }

    return order;
  }

  findAll() {
    return this.orderRepo.find({ relations: { user: true, plan: true }, order: { createdAt: 'DESC' } });
  }

  findMine(userId: string) {
    return this.orderRepo.find({ where: { userId }, relations: { plan: true }, order: { createdAt: 'DESC' } });
  }

  /** Huỷ đơn PENDING: nhả coupon + hoàn ví trong 1 transaction. Dùng cho user huỷ tay & cron. */
  async cancelOrder(orderId: string, opts: { userId?: string } = {}): Promise<void> {
    let telegramMessageId: string | null = null;

    await this.orderRepo.manager.transaction(async (em: EntityManager) => {
      const where: any = { id: orderId, status: OrderStatus.PENDING };
      if (opts.userId) where.userId = opts.userId;
      const order = await em.findOne(Order, { where });
      if (!order) throw new BadRequestException('Đơn không thể huỷ (đã thanh toán hoặc không tồn tại)');

      telegramMessageId = order.telegramMessageId;
      if (order.couponId) await this.coupons.releaseUse(order.couponId);
      if (Number(order.walletUsed) > 0) {
        await this.wallet.refund(order.userId, Number(order.walletUsed), order.id, em);
      }
      await em.delete(Order, { id: orderId });
    });

    if (telegramMessageId) {
      await this.telegram.deleteMessage(telegramMessageId).catch(() => {});
    }
  }

  /** Mỗi 10 phút: xóa các đơn PENDING quá hạn thanh toán. */
  @Cron('*/10 * * * *')
  async expirePending(): Promise<void> {
    const stale = await this.orderRepo.find({
      where: { status: OrderStatus.PENDING, expiresAt: LessThan(new Date()) },
      select: { id: true },
      take: 200,
    });
    for (const { id } of stale) {
      await this.cancelOrder(id).catch(() => {});
    }
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { KeySubscription } from '../subscriptions/key-subscription.entity';
import { PlansService } from '../plans/plans.service';
import { CouponsService } from '../coupons/coupons.service';
import { ReferralService } from '../referral/referral.service';
import { NineRouterService } from '../nine-router/nine-router.service';
import { WalletService } from '../wallet/wallet.service';
import { DiscountType } from '../coupons/coupon.entity';
import { CreateOrderDto } from './dto/create-order.dto';

const VIETQR_BASE = 'https://img.vietqr.io/image/TECHCOMBANK-19032009391010-compact.png';

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
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const plan = await this.plans.findOne(dto.planId);
    if (!plan.isActive) throw new BadRequestException('Gói này không còn khả dụng');

    const originalPrice = Number(plan.price);
    let discountAmount = 0;
    let couponId: string | null = null;

    if (dto.couponCode) {
      const coupon = await this.coupons.validate(dto.couponCode);
      couponId = coupon.id;
      if (coupon.discountType === DiscountType.PERCENT) {
        discountAmount = originalPrice * (Number(coupon.discountValue) / 100);
      } else {
        discountAmount = Number(coupon.discountValue);
      }
      discountAmount = Math.min(discountAmount, originalPrice);
    }

    // Tính số dư ví có thể dùng
    let walletUsed = 0;
    if (dto.useWallet) {
      const balance = await this.wallet.getBalance(userId);
      walletUsed = Math.min(balance, originalPrice - discountAmount);
      walletUsed = Math.max(0, walletUsed);
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount - walletUsed);
    const order = await this.orderRepo.save(this.orderRepo.create({
      userId,
      planId: plan.id,
      couponId,
      originalPrice,
      discountAmount,
      walletUsed,
      finalPrice,
    }));

    // Trừ ví ngay khi tạo đơn (lock số dư)
    if (walletUsed > 0) {
      await this.wallet.spendForOrder(userId, walletUsed, order.id);
    }

    const vietQRUrl = finalPrice > 0
      ? `${VIETQR_BASE}?amount=${finalPrice}&addInfo=AIKEY-${order.id.slice(0, 8)}`
      : '';

    // Ví cover 100% — confirm ngay không cần QR
    if (finalPrice === 0) {
      await this.confirmOrder(order.id);
      const confirmed = await this.orderRepo.findOne({ where: { id: order.id } });
      return { order: confirmed!, vietQRUrl: '' };
    }

    return { order, vietQRUrl };
  }

  async confirmOrder(orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { plan: true, user: true },
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.status !== OrderStatus.PENDING) throw new BadRequestException('Đơn hàng không ở trạng thái chờ');

    const { id: keyId, key: keyValue } = await this.nineRouter.createKey(order.user.name);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + order.plan.durationDays * 86400000);

    await this.subRepo.save(this.subRepo.create({
      userId: order.userId,
      orderId: order.id,
      nineRouterKeyId: keyId,
      nineRouterKey: keyValue,
      tokenQuota: order.plan.tokenQuota,
      startsAt: now,
      expiresAt,
      periodStartsAt: now,
    }));

    order.status = OrderStatus.PAID;
    order.paidAt = now;
    order.nineRouterKeyId = keyId;
    order.nineRouterKey = keyValue;
    await this.orderRepo.save(order);

    if (order.couponId) {
      await this.coupons.incrementUsed(order.couponId).catch(() => {});
    }

    // Hoa hồng chỉ tính trên tiền QR thật (finalPrice), không tính phần trả bằng ví
    if (order.user.referredBy && Number(order.finalPrice) > 0) {
      await this.referral.creditCommission(order.user.referredBy, Number(order.finalPrice), order.id, this.wallet).catch(() => {});
    }

    return order;
  }

  findAll() {
    return this.orderRepo.find({ relations: { user: true, plan: true }, order: { createdAt: 'DESC' } });
  }

  findMine(userId: string) {
    return this.orderRepo.find({ where: { userId }, relations: { plan: true }, order: { createdAt: 'DESC' } });
  }
}

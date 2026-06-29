import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './order.entity';
import { KeySubscription } from '../subscriptions/key-subscription.entity';
import { PlansService } from '../plans/plans.service';
import { CouponsService } from '../coupons/coupons.service';
import { ReferralService } from '../referral/referral.service';
import { NineRouterService } from '../nine-router/nine-router.service';
import { WalletService } from '../wallet/wallet.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockEm = {
    create: jest.fn((_e, v) => v), save: jest.fn((v: any) => v),
    update: jest.fn(), findOneOrFail: jest.fn(),
  };
  const mockOrderRepo = {
    find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn(),
    manager: { transaction: jest.fn((cb: any) => cb(mockEm)) },
  };
  const mockSubRepo = { create: jest.fn(), findOne: jest.fn(), save: jest.fn() };
  const mockPlans = { findOne: jest.fn() };
  const mockCoupons = { validate: jest.fn(), validateAndReserve: jest.fn(), releaseUse: jest.fn(), update: jest.fn() };
  const mockReferral = { findByCode: jest.fn(), creditCommission: jest.fn() };
  const mockNineRouter = { createKey: jest.fn() };
  const mockWallet = { getBalance: jest.fn(), spendForOrder: jest.fn(), refund: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(KeySubscription), useValue: mockSubRepo },
        { provide: PlansService, useValue: mockPlans },
        { provide: CouponsService, useValue: mockCoupons },
        { provide: ReferralService, useValue: mockReferral },
        { provide: NineRouterService, useValue: mockNineRouter },
        { provide: WalletService, useValue: mockWallet },
      ],
    }).compile();
    service = module.get(OrdersService);
    jest.clearAllMocks();
  });

  it('confirmOrder creates KeySubscription expiring planDurationDays from now', async () => {
    const plan = { id: 'p1', durationDays: 30, tokenQuota: 21000000, price: 350000 };
    const order = {
      id: 'o1', userId: 'u1', planId: 'p1', plan,
      status: OrderStatus.PENDING, couponId: null, referralCode: null,
      finalPrice: 350000, paidAt: new Date(), user: { name: 'Test' },
    };
    mockOrderRepo.update.mockResolvedValue({ affected: 1 }); // atomic claim thành công
    mockOrderRepo.findOne.mockResolvedValue(order);
    mockNineRouter.createKey.mockResolvedValue({ id: 'k1', key: 'sk-abc' });
    mockSubRepo.create.mockImplementation((v: any) => v);
    mockSubRepo.save.mockImplementation((v: any) => v);
    mockOrderRepo.save.mockImplementation((v: any) => v);

    await service.confirmOrder('o1');

    const savedSub = mockSubRepo.save.mock.calls[0][0];
    const diffDays = Math.round((savedSub.expiresAt.getTime() - savedSub.startsAt.getTime()) / 86400000);
    expect(diffDays).toBe(30);
    expect(savedSub.tokenQuota).toBe(21000000);
  });

  it('confirmOrder rejects double-confirm when atomic claim affects 0 rows', async () => {
    mockOrderRepo.update.mockResolvedValue({ affected: 0 });
    mockOrderRepo.findOne.mockResolvedValue({ id: 'o1', status: OrderStatus.PAID });
    await expect(service.confirmOrder('o1')).rejects.toBeInstanceOf(BadRequestException);
    expect(mockNineRouter.createKey).not.toHaveBeenCalled(); // không tạo key thứ 2
  });

  it('createOrder rolls back when wallet has insufficient balance (atomic spend fails)', async () => {
    mockPlans.findOne.mockResolvedValue({ id: 'p1', price: 100000, isActive: true });
    mockWallet.getBalance.mockResolvedValue(100000);
    mockWallet.spendForOrder.mockResolvedValue(false); // race: ví bị trừ mất giữa chừng
    await expect(service.createOrder('u1', { planId: 'p1', useWallet: true } as any))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('confirmOrder for renewal extends old sub (keeps key, adds time+quota) — no new key', async () => {
    const plan = { id: 'p1', durationDays: 30, tokenQuota: 1000, price: 100000 };
    const futureExp = new Date(Date.now() + 5 * 86400000); // còn 5 ngày
    const sub = {
      id: 's1', userId: 'u1', nineRouterKeyId: 'k1', nineRouterKey: 'sk-old',
      tokenQuota: 1000, expiresAt: futureExp, isActive: false,
    };
    mockOrderRepo.update.mockResolvedValue({ affected: 1 });
    mockOrderRepo.findOne.mockResolvedValue({
      id: 'o1', userId: 'u1', plan, status: OrderStatus.PENDING,
      paidAt: new Date(), finalPrice: 100000, renewSubscriptionId: 's1',
      couponId: null, user: { name: 'T', referredBy: null },
    });
    mockSubRepo.findOne.mockResolvedValue(sub);
    mockSubRepo.save.mockImplementation((v: any) => v);
    mockOrderRepo.save.mockImplementation((v: any) => v);

    await service.confirmOrder('o1');

    expect(mockNineRouter.createKey).not.toHaveBeenCalled(); // giữ key cũ
    const saved = mockSubRepo.save.mock.calls[0][0];
    expect(saved.tokenQuota).toBe(2000);          // 1000 + 1000
    expect(saved.isActive).toBe(true);            // kích hoạt lại
    // cộng dồn từ ngày hết hạn cũ (còn hạn) → +30 ngày kể từ futureExp
    const diff = Math.round((saved.expiresAt.getTime() - futureExp.getTime()) / 86400000);
    expect(diff).toBe(30);
  });

  it('cancelOrder releases coupon and refunds wallet atomically', async () => {
    mockEm.update.mockResolvedValue({ affected: 1 });
    mockEm.findOneOrFail.mockResolvedValue({ id: 'o1', userId: 'u1', couponId: 'c1', walletUsed: 50000 });
    await service.cancelOrder('o1', { userId: 'u1' });
    expect(mockCoupons.releaseUse).toHaveBeenCalledWith('c1');
    expect(mockWallet.refund).toHaveBeenCalledWith('u1', 50000, 'o1', mockEm);
  });

  it('cancelOrder rejects when order already paid (claim affects 0)', async () => {
    mockEm.update.mockResolvedValue({ affected: 0 });
    await expect(service.cancelOrder('o1', { userId: 'u1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(mockWallet.refund).not.toHaveBeenCalled();
  });
});

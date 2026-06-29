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

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrderRepo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const mockSubRepo = { create: jest.fn(), save: jest.fn() };
  const mockPlans = { findOne: jest.fn() };
  const mockCoupons = { validate: jest.fn(), update: jest.fn() };
  const mockReferral = { findByCode: jest.fn(), creditCommission: jest.fn() };
  const mockNineRouter = { createKey: jest.fn() };

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
      finalPrice: 350000, user: { name: 'Test' },
    };
    mockOrderRepo.findOne.mockResolvedValue(order);
    mockNineRouter.createKey.mockResolvedValue({ id: 'k1', key: 'sk-abc' });
    mockSubRepo.create.mockImplementation((v: any) => v);
    mockSubRepo.save.mockImplementation((v: any) => v);
    mockOrderRepo.save.mockImplementation((v: any) => v);

    const result = await service.confirmOrder('o1');

    expect(mockSubRepo.save).toHaveBeenCalled();
    const savedSub = mockSubRepo.save.mock.calls[0][0];
    const diffDays = Math.round((savedSub.expiresAt.getTime() - savedSub.startsAt.getTime()) / 86400000);
    expect(diffDays).toBe(30);
    expect(savedSub.tokenQuota).toBe(21000000);
  });
});

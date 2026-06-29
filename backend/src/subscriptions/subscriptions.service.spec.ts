import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { KeySubscription } from './key-subscription.entity';
import { NineRouterService } from '../nine-router/nine-router.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  // em dùng trong transaction: findOne (có lock) + save
  const mockEm = { findOne: jest.fn(), save: jest.fn() };
  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    manager: { transaction: jest.fn((cb: any) => cb(mockEm)) },
  };
  const mockNineRouter = { createKey: jest.fn(), deleteKey: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(KeySubscription), useValue: mockRepo },
        { provide: NineRouterService, useValue: mockNineRouter },
      ],
    }).compile();
    service = module.get(SubscriptionsService);
    jest.clearAllMocks();
  });

  it('deductTokens adds inputTokens + outputTokens to tokenUsed atomically and returns QuotaInfo', async () => {
    const sub = {
      id: '1', tokenQuota: 1000000, tokenUsed: 100, tokenUsedPeriod: 0,
      periodStartsAt: new Date(Date.now() - 1000), isActive: true,
    } as any;
    mockEm.findOne.mockResolvedValue(sub);
    mockEm.save.mockImplementation((v: any) => v);

    const quota = await service.deductTokens('1', 500, 300);

    // phải dùng row lock để chống lost update
    expect(mockEm.findOne).toHaveBeenCalledWith(
      KeySubscription,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(mockEm.save).toHaveBeenCalledWith(expect.objectContaining({ tokenUsed: 900 }));
    expect(quota.remainingTotal).toBe(999100);
    expect(quota.resetAt).toBeInstanceOf(Date);
  });
});

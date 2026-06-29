import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { KeySubscription } from './key-subscription.entity';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(KeySubscription), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(SubscriptionsService);
    jest.clearAllMocks();
  });

  it('deductTokens adds inputTokens + outputTokens to tokenUsed and returns QuotaInfo', async () => {
    const sub = {
      id: '1', tokenQuota: 1000000, tokenUsed: 100, tokenUsedPeriod: 0,
      periodStartsAt: new Date(Date.now() - 1000), isActive: true,
    } as any;
    mockRepo.findOne.mockResolvedValue(sub);
    mockRepo.save.mockImplementation((v: any) => v);

    const quota = await service.deductTokens('1', 500, 300);

    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ tokenUsed: 900 }));
    expect(quota.remainingTotal).toBe(999100);
    expect(quota.resetAt).toBeInstanceOf(Date);
  });
});

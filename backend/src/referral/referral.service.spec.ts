import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReferralService } from './referral.service';
import { ReferralCode } from './referral-code.entity';

describe('ReferralService', () => {
  let service: ReferralService;
  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: getRepositoryToken(ReferralCode), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(ReferralService);
    jest.clearAllMocks();
  });

  it('creditCommission adds 10% of amount to totalEarned', async () => {
    const ref = { id: '1', code: 'ABC12345', commissionPercent: 10, totalEarned: 0, userId: 'u1' } as any;
    mockRepo.findOne.mockResolvedValue(ref);
    mockRepo.save.mockResolvedValue({ ...ref, totalEarned: 35000 });

    const mockWallet = { creditCommission: jest.fn().mockResolvedValue(undefined) } as any;
    await service.creditCommission('ABC12345', 350000, 'order-id', mockWallet);

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ totalEarned: 35000 })
    );
  });
});

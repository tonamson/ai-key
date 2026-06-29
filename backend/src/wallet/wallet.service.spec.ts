import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WalletService } from './wallet.service';
import { WalletTransaction } from './wallet-transaction.entity';
import { User } from '../users/user.entity';

describe('WalletService.spendForOrder (atomic)', () => {
  let service: WalletService;

  // QueryBuilder giả: ghi lại affected do test set
  const makeQb = (affected: number) => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected }),
  });

  const mockEm = {
    createQueryBuilder: jest.fn(),
    save: jest.fn((v: any) => v),
    create: jest.fn((_e, v) => v),
  };
  const mockDataSource = { transaction: jest.fn((cb: any) => cb(mockEm)) };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(WalletTransaction), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();
    service = module.get(WalletService);
    jest.clearAllMocks();
  });

  it('returns true and records SPEND tx when balance sufficient (affected=1)', async () => {
    mockEm.createQueryBuilder.mockReturnValue(makeQb(1));
    const ok = await service.spendForOrder('u1', 5000, 'o1', mockEm as any);
    expect(ok).toBe(true);
    expect(mockEm.save).toHaveBeenCalledWith(WalletTransaction, expect.objectContaining({ amount: -5000 }));
  });

  it('returns false and records NO tx when balance insufficient (affected=0)', async () => {
    mockEm.createQueryBuilder.mockReturnValue(makeQb(0));
    const ok = await service.spendForOrder('u1', 999999, 'o1', mockEm as any);
    expect(ok).toBe(false);
    expect(mockEm.save).not.toHaveBeenCalled();
  });

  it('returns true immediately for zero amount without touching DB', async () => {
    const ok = await service.spendForOrder('u1', 0, 'o1', mockEm as any);
    expect(ok).toBe(true);
    expect(mockEm.createQueryBuilder).not.toHaveBeenCalled();
  });
});

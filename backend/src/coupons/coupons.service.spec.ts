import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { Coupon, DiscountType } from './coupon.entity';

describe('CouponsService', () => {
  let service: CouponsService;
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
        CouponsService,
        { provide: getRepositoryToken(Coupon), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(CouponsService);
    jest.clearAllMocks();
  });

  it('validate throws BadRequest when coupon expired', async () => {
    const expired = {
      id: '1', code: 'SAVE10', discountType: DiscountType.PERCENT,
      discountValue: 10, maxUses: null, usedCount: 0,
      expiresAt: new Date('2020-01-01'), isActive: true,
    } as Coupon;
    mockRepo.findOne.mockResolvedValue(expired);
    await expect(service.validate('SAVE10')).rejects.toThrow(BadRequestException);
  });

  it('validate throws BadRequest when maxUses reached', async () => {
    const exhausted = {
      id: '1', code: 'SAVE10', discountType: DiscountType.PERCENT,
      discountValue: 10, maxUses: 5, usedCount: 5,
      expiresAt: null, isActive: true,
    } as Coupon;
    mockRepo.findOne.mockResolvedValue(exhausted);
    await expect(service.validate('SAVE10')).rejects.toThrow(BadRequestException);
  });

  it('validate returns coupon when valid', async () => {
    const valid = {
      id: '1', code: 'SAVE10', discountType: DiscountType.PERCENT,
      discountValue: 10, maxUses: null, usedCount: 0,
      expiresAt: null, isActive: true,
    } as Coupon;
    mockRepo.findOne.mockResolvedValue(valid);
    const result = await service.validate('SAVE10');
    expect(result).toEqual(valid);
  });
});

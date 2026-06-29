import { Test } from '@nestjs/testing';
import { HttpException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('ProxyService', () => {
  let service: ProxyService;
  const mockSubs = { findActiveByKey: jest.fn(), deductTokens: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProxyService,
        { provide: SubscriptionsService, useValue: mockSubs },
      ],
    }).compile();
    service = module.get(ProxyService);
    jest.clearAllMocks();
  });

  it('forward throws 401 when key not found', async () => {
    mockSubs.findActiveByKey.mockResolvedValue(null);
    await expect(service.forward('bad-key', '/chat/completions', 'POST', {}, {}))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('forward throws 429 when tokenUsed >= tokenQuota', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', tokenUsed: 1000000, tokenQuota: 1000000,
      expiresAt: new Date(Date.now() + 86400000), isActive: true,
    });
    await expect(service.forward('key', '/chat/completions', 'POST', {}, {}))
      .rejects.toThrow(HttpException);
  });

  it('forward throws 403 when subscription expired', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', tokenUsed: 0, tokenQuota: 1000000,
      expiresAt: new Date(Date.now() - 1000), isActive: true,
    });
    await expect(service.forward('key', '/chat/completions', 'POST', {}, {}))
      .rejects.toBeInstanceOf(ForbiddenException);
  });
});

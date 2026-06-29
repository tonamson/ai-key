import { Test } from '@nestjs/testing';
import { HttpException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ClaudeProxyService } from './claude-proxy.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const mockQuota = { limitTotal: 1e6, remainingTotal: 500000, limitPeriod: 1389, remainingPeriod: 1000, resetAt: new Date() };

describe('ClaudeProxyService', () => {
  let service: ClaudeProxyService;
  const mockSubs = {
    findActiveByKey: jest.fn(),
    deductTokens: jest.fn(),
    getQuotaInfo: jest.fn().mockReturnValue(mockQuota),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClaudeProxyService,
        { provide: SubscriptionsService, useValue: mockSubs },
      ],
    }).compile();
    service = module.get(ClaudeProxyService);
    jest.clearAllMocks();
  });

  it('throws 401 when key not found', async () => {
    mockSubs.findActiveByKey.mockResolvedValue(null);
    await expect(service.forward('bad-key', '/chat/completions', 'POST', {}))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws 429 when tokenUsed >= tokenQuota', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', tokenUsed: 1000000, tokenQuota: 1000000,
      expiresAt: new Date(Date.now() + 86400000), isActive: true,
      periodStartsAt: new Date(), tokenUsedPeriod: 0,
    });
    await expect(service.forward('key', '/chat/completions', 'POST', {}))
      .rejects.toBeInstanceOf(HttpException);
  });

  it('throws 403 when subscription expired', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', tokenUsed: 0, tokenQuota: 1000000,
      expiresAt: new Date(Date.now() - 1000), isActive: true,
      periodStartsAt: new Date(), tokenUsedPeriod: 0,
    });
    await expect(service.forward('key', '/chat/completions', 'POST', {}))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws 429 when hourly period quota exhausted (remainingPeriod=0)', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', tokenUsed: 0, tokenQuota: 1000000,
      expiresAt: new Date(Date.now() + 86400000), isActive: true,
      periodStartsAt: new Date(), tokenUsedPeriod: 0,
    });
    mockSubs.getQuotaInfo.mockReturnValueOnce({ ...mockQuota, remainingTotal: 500000, remainingPeriod: 0 });
    await expect(service.forward('key', '/messages', 'POST', {}))
      .rejects.toBeInstanceOf(HttpException);
  });

  it('finalizeStream parses SSE usage and deducts tokens (anthropic delta)', async () => {
    const raw = [
      'event: message_start',
      'data: {"message":{"usage":{"input_tokens":40,"output_tokens":1}}}',
      '',
      'event: message_delta',
      'data: {"usage":{"output_tokens":250}}',
      '',
      'data: [DONE]',
    ].join('\n');
    mockSubs.deductTokens.mockResolvedValue(mockQuota);
    await service.finalizeStream('sub-1', raw);
    expect(mockSubs.deductTokens).toHaveBeenCalledWith('sub-1', 40, 250);
  });

  it('finalizeStream does not deduct when stream has no usage', async () => {
    await service.finalizeStream('sub-1', 'data: {"choices":[]}\n\ndata: [DONE]');
    expect(mockSubs.deductTokens).not.toHaveBeenCalled();
  });
});

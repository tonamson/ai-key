import { Test } from '@nestjs/testing';
import { HttpException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaudeProxyService } from './claude-proxy.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { StatsService } from '../stats/stats.service';

const mockQuota = { limitTotal: 1e6, remainingTotal: 500000, limitPeriod: 1389, remainingPeriod: 1000, resetAt: new Date() };

describe('ClaudeProxyService', () => {
  let service: ClaudeProxyService;
  const mockSubs = {
    findActiveByKey: jest.fn(),
    findById: jest.fn().mockResolvedValue(null),
    deductTokens: jest.fn(),
    getQuotaInfo: jest.fn().mockReturnValue(mockQuota),
  };
  const mockStats = { logTokenUsage: jest.fn().mockResolvedValue(undefined) };
  const mockConfig = { getOrThrow: jest.fn().mockReturnValue('http://upstream.test/v1') };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClaudeProxyService,
        { provide: SubscriptionsService, useValue: mockSubs },
        { provide: StatsService, useValue: mockStats },
        { provide: ConfigService, useValue: mockConfig },
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

  it('throws 429 when total quota exhausted (remainingTotal=0)', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', expiresAt: new Date(Date.now() + 86400000),
    });
    mockSubs.getQuotaInfo.mockReturnValueOnce({ ...mockQuota, remainingTotal: 0 });
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

  it('finalizeStream counts anthropic cache tokens as input (Claude Code)', async () => {
    // usage thật của Claude Code: input_tokens + cache_creation + cache_read đều là tiền thật.
    const raw = [
      'data: {"type":"message_start","message":{"usage":{"input_tokens":904,"cache_creation_input_tokens":1200,"cache_read_input_tokens":5000,"output_tokens":1}}}',
      'data: {"type":"message_delta","usage":{"output_tokens":50}}',
      'data: [DONE]',
    ].join('\n');
    mockSubs.deductTokens.mockResolvedValue(mockQuota);
    await service.finalizeStream('sub-1', raw);
    // weighted: 904 + 1200*1.25 + 5000*0.1 = 904 + 1500 + 500 = 2904
    expect(mockSubs.deductTokens).toHaveBeenCalledWith('sub-1', 2904, 50);
  });

  it('finalizeStream parses Responses API usage nested in response (Codex)', async () => {
    const raw = [
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":300,"output_tokens":80}}}',
      'data: [DONE]',
    ].join('\n');
    mockSubs.deductTokens.mockResolvedValue(mockQuota);
    await service.finalizeStream('sub-1', raw);
    expect(mockSubs.deductTokens).toHaveBeenCalledWith('sub-1', 300, 80);
  });

  it('finalizeStream parses OpenAI stream usage (include_usage last chunk)', async () => {
    const raw = [
      'data: {"choices":[{"delta":{"content":"hi"}}]}',
      'data: {"choices":[],"usage":{"prompt_tokens":100,"completion_tokens":20}}',
      'data: [DONE]',
    ].join('\n');
    mockSubs.deductTokens.mockResolvedValue(mockQuota);
    await service.finalizeStream('sub-1', raw);
    expect(mockSubs.deductTokens).toHaveBeenCalledWith('sub-1', 100, 20);
  });

  it('finalizeStream does not deduct when stream has no usage', async () => {
    await service.finalizeStream('sub-1', 'data: {"choices":[]}\n\ndata: [DONE]');
    expect(mockSubs.deductTokens).not.toHaveBeenCalled();
  });

  // Pure passthrough: non-stream JSON trả VERBATIM (raw string), chỉ đọc usage để trừ token.
  it('non-stream returns raw body verbatim + deducts tokens from usage (anthropic)', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', userId: 'u1', expiresAt: new Date(Date.now() + 86400000),
    });
    mockSubs.deductTokens.mockResolvedValue(mockQuota);

    const raw = JSON.stringify({
      id: 'm1', role: 'assistant',
      content: [{ type: 'tool_use', name: 'Bash_ide', input: { command: 'ls' } }],
      usage: { input_tokens: 40, output_tokens: 12 },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      text: async () => raw,
    }) as any;

    const result = await service.forward('key', '/messages', 'POST', { stream: false });

    expect(result.isStream).toBe(false);
    expect(result.body).toBe(raw); // byte y chang — KHÔNG transform (name "_ide" giữ nguyên)
    expect(mockSubs.deductTokens).toHaveBeenCalledWith('1', 40, 12);
  });

  // OpenAI shape: usage dùng prompt_tokens/completion_tokens.
  it('non-stream deducts tokens from OpenAI-style usage', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', userId: 'u1', expiresAt: new Date(Date.now() + 86400000),
    });
    mockSubs.deductTokens.mockResolvedValue(mockQuota);

    const raw = JSON.stringify({
      id: 'c1', object: 'chat.completion',
      choices: [{ message: { role: 'assistant', content: 'hi' } }],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      text: async () => raw,
    }) as any;

    const result = await service.forward('key', '/chat/completions', 'POST', {});
    expect(result.body).toBe(raw);
    expect(mockSubs.deductTokens).toHaveBeenCalledWith('1', 100, 20);
  });

  // Stream: proxy trả Response gốc để controller bơm verbatim, KHÔNG trừ token ở forward().
  it('stream response is passed through without deducting in forward()', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', userId: 'u1', expiresAt: new Date(Date.now() + 86400000),
    });
    const upstream = { ok: true, headers: { get: () => 'text/event-stream' } };
    global.fetch = jest.fn().mockResolvedValue(upstream) as any;

    const result = await service.forward('key', '/messages', 'POST', { stream: true });
    expect(result.isStream).toBe(true);
    expect(result.body).toBe(upstream);
    expect(mockSubs.deductTokens).not.toHaveBeenCalled();
  });
});

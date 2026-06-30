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

  it('finalizeStream does not deduct when stream has no usage', async () => {
    await service.finalizeStream('sub-1', 'data: {"choices":[]}\n\ndata: [DONE]');
    expect(mockSubs.deductTokens).not.toHaveBeenCalled();
  });

  // Kiểm chứng: khi client xin non-stream, proxy ép stream:true rồi gom SSE thành JSON.
  // Phải giữ NGUYÊN tool_use.name và ráp đúng input từ các input_json_delta bị chia nhỏ —
  // không đổi tên (vd thêm hậu tố), không nuốt mất tham số.
  it('assembly path preserves tool_use name + reassembles split input_json_delta', async () => {
    mockSubs.findActiveByKey.mockResolvedValue({
      id: '1', expiresAt: new Date(Date.now() + 86400000),
    });
    mockSubs.deductTokens.mockResolvedValue(mockQuota);

    // SSE thật từ Anthropic: tool_use có input JSON bị chia thành nhiều partial_json chunk.
    const sse = [
      'data: {"type":"message_start","message":{"id":"m1","role":"assistant","model":"x","content":[],"usage":{"input_tokens":40,"output_tokens":1}}}',
      'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_1","name":"Bash_ide","input":{}}}',
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\\"comm"}}',
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"and\\":\\"ls\\"}"}}',
      'data: {"type":"content_block_stop","index":0}',
      'data: {"type":"message_delta","delta":{"stop_reason":"tool_use"},"usage":{"output_tokens":12}}',
      'data: [DONE]',
    ].join('\n');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' }, // non-stream → nhánh assembly
      text: async () => sse,
    }) as any;

    // body.stream khác true → client xin non-stream
    const result = await service.forward('key', '/messages', 'POST', { stream: false, tools: [{ name: 'Bash' }] });

    expect(result.isStream).toBe(false);
    const tool = result.body.content.find((b: any) => b.type === 'tool_use');
    expect(tool).toBeDefined();
    expect(tool.name).toBe('Bash');           // hậu tố "_ide" do upstream chèn đã được bóc
    expect(tool.input).toEqual({ command: 'ls' }); // input ráp đúng, không rỗng
    expect(mockSubs.deductTokens).toHaveBeenCalledWith('1', 40, 12);
  });

  describe('stripInjectedToolSuffix', () => {
    const valid = new Set(['get_weather', 'Bash']);

    it('strips _ide only when stripped name matches a client tool', () => {
      const line = 'data: {"type":"tool_use","name":"get_weather_ide","input":{}}';
      expect(service.stripInjectedToolSuffix(line, valid))
        .toContain('"name":"get_weather"');
    });

    it('leaves real tool names ending in _ide untouched', () => {
      // "open_ide" -> base "open" không nằm trong valid -> giữ nguyên
      const line = 'data: {"name":"open_ide"}';
      expect(service.stripInjectedToolSuffix(line, valid)).toBe(line);
    });

    it('is a no-op when no tools / no _ide present', () => {
      expect(service.stripInjectedToolSuffix('hello', new Set())).toBe('hello');
      expect(service.stripInjectedToolSuffix('{"name":"Bash"}', valid)).toBe('{"name":"Bash"}');
    });
  });
});

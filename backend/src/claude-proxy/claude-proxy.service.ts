import { ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { QuotaInfo, SubscriptionsService } from '../subscriptions/subscriptions.service';
import { KeySubscription } from '../subscriptions/key-subscription.entity';
import { StatsService } from '../stats/stats.service';

const NINE_ROUTER_BASE = process.env.NINE_ROUTER_URL ?? 'http://103.172.78.21:20128/v1';

export interface ForwardResult {
  body: any;
  isStream: boolean;
  quota: QuotaInfo;
  sub: KeySubscription;
}

@Injectable()
export class ClaudeProxyService {
  constructor(private readonly subs: SubscriptionsService, private readonly stats: StatsService) {}

  private parseUsage(body: any): { input: number; output: number } {
    const usage = body?.usage;
    return {
      input: usage?.input_tokens ?? usage?.prompt_tokens ?? 0,
      output: usage?.output_tokens ?? usage?.completion_tokens ?? 0,
    };
  }

  async forward(nineRouterKey: string, path: string, method: string, body: any): Promise<ForwardResult> {
    const sub = await this.subs.findActiveByKey(nineRouterKey);
    if (!sub) throw new UnauthorizedException('Key không hợp lệ hoặc hết hạn');
    if (sub.expiresAt < new Date()) throw new ForbiddenException('Subscription đã hết hạn');

    // Chặn cả quota tổng và quota theo giờ (period) TRƯỚC khi gọi upstream
    const pre = this.subs.getQuotaInfo(sub);
    if (pre.remainingTotal <= 0) throw new HttpException('Quota đã hết', 429);
    if (pre.remainingPeriod <= 0) throw new HttpException('Đã đạt giới hạn token theo giờ', 429);

    const res = await fetch(`${NINE_ROUTER_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nineRouterKey}` },
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('text/event-stream')) {
      // Token trừ sau khi stream kết thúc (controller gọi deductFromStreamChunk + finalizeStream)
      return { body: res, isStream: true, quota: pre, sub };
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new HttpException(json, res.status);

    const { input, output } = this.parseUsage(json);
    const quota = input + output > 0
      ? await this.subs.deductTokens(sub.id, input, output).catch(() => this.subs.getQuotaInfo(sub))
      : this.subs.getQuotaInfo(sub);
    if (input + output > 0) this.stats.logTokenUsage(sub.id, sub.userId, input, output).catch(() => {});

    return { body: json, isStream: false, quota, sub };
  }

  /**
   * Bóc usage từ text SSE đã gom và trừ token. Anthropic gửi input_tokens ở message_start,
   * output_tokens (tích luỹ) ở message_delta. OpenAI gửi usage ở chunk cuối khi stream_options.include_usage.
   */
  async finalizeStream(subId: string, raw: string): Promise<void> {
    let input = 0;
    let output = 0;
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      let evt: any;
      try { evt = JSON.parse(data); } catch { continue; }
      const u = evt?.usage ?? evt?.message?.usage;
      if (!u) continue;
      // lấy giá trị lớn nhất gặp được (output_tokens là tích luỹ trong Anthropic delta)
      input = Math.max(input, u.input_tokens ?? u.prompt_tokens ?? 0);
      output = Math.max(output, u.output_tokens ?? u.completion_tokens ?? 0);
    }
    if (input + output > 0) {
      const sub = await this.subs.findById(subId).catch(() => null);
      await this.subs.deductTokens(subId, input, output).catch(() => {});
      if (sub) this.stats.logTokenUsage(subId, sub.userId, input, output).catch(() => {});
    }
  }
}

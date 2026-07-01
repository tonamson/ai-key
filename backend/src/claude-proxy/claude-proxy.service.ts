import { ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuotaInfo, SubscriptionsService } from '../subscriptions/subscriptions.service';
import { KeySubscription } from '../subscriptions/key-subscription.entity';
import { StatsService } from '../stats/stats.service';

export interface ForwardResult {
  body: any;            // stream: fetch Response; non-stream: raw string (verbatim upstream body)
  isStream: boolean;
  contentType: string;  // echo upstream Content-Type verbatim
  quota: QuotaInfo;
  sub: KeySubscription;
}

@Injectable()
export class ClaudeProxyService {
  private readonly nineRouterBase: string;

  constructor(
    private readonly subs: SubscriptionsService,
    private readonly stats: StatsService,
    config: ConfigService,
  ) {
    this.nineRouterBase = config.getOrThrow('NINE_ROUTER_URL');
  }

  /**
   * Pure passthrough tới 9Router: KHÔNG sửa request, KHÔNG sửa response.
   * Việc duy nhất backend làm thêm là đọc token in/out để trừ quota (tính phí).
   */
  async forward(nineRouterKey: string, path: string, method: string, body: any, clientHeaders: Record<string, any> = {}): Promise<ForwardResult> {
    const sub = await this.subs.findActiveByKey(nineRouterKey);
    if (!sub) throw new UnauthorizedException('Key không hợp lệ hoặc hết hạn');
    if (sub.expiresAt < new Date()) throw new ForbiddenException('Subscription đã hết hạn');

    const pre = this.subs.getQuotaInfo(sub);
    if (pre.remainingTotal <= 0) throw new HttpException('Quota đã hết', 429);
    if (pre.remainingPeriod <= 0) throw new HttpException('Đã đạt giới hạn token theo giờ', 429);

    // Forward client identity headers so 9Router detects the real client (clientDetector.js).
    const fwd = (k: string) => clientHeaders[k] ?? clientHeaders[k.toLowerCase()];
    const passHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${nineRouterKey}`,
    };
    for (const h of ['user-agent', 'x-app', 'anthropic-version', 'anthropic-beta', 'x-stainless-lang']) {
      const v = fwd(h);
      if (v) passHeaders[h] = String(v);
    }

    // Body nguyên vẹn — không ép stream, không strip field nào.
    const upstreamBody = body && method !== 'GET' ? JSON.stringify(body) : undefined;

    const res = await fetch(`${this.nineRouterBase}${path}`, {
      method,
      headers: passHeaders,
      body: upstreamBody,
    });

    const contentType = res.headers.get('content-type') ?? '';

    if (!res.ok) {
      // Trả lỗi verbatim (giữ nguyên body + status upstream)
      const raw = await res.text();
      let parsed: any = raw;
      try { parsed = JSON.parse(raw); } catch { /* giữ raw string */ }
      throw new HttpException(parsed, res.status);
    }

    // Stream: bơm verbatim ở controller; token trừ qua finalizeStream.
    if (contentType.includes('text/event-stream')) {
      return { body: res, isStream: true, contentType, quota: pre, sub };
    }

    // Non-stream: đọc raw, đếm token, trả byte y chang.
    const raw = await res.text();
    const { input, output } = this.extractUsageFromRaw(raw, contentType);

    const quota = input + output > 0
      ? await this.subs.deductTokens(sub.id, input, output).catch(() => this.subs.getQuotaInfo(sub))
      : this.subs.getQuotaInfo(sub);
    if (input + output > 0) this.stats.logTokenUsage(sub.id, sub.userId, input, output).catch(() => {});

    return { body: raw, isStream: false, contentType, quota, sub };
  }

  /** Đọc usage từ response non-stream (JSON hoặc SSE gom sẵn). Không sửa payload. */
  private extractUsageFromRaw(raw: string, contentType: string): { input: number; output: number } {
    if (contentType.includes('text/event-stream') || raw.startsWith('data:')) {
      return this.extractUsageFromSse(raw);
    }
    try {
      const u = JSON.parse(raw)?.usage;
      return {
        input: u?.input_tokens ?? u?.prompt_tokens ?? 0,
        output: u?.output_tokens ?? u?.completion_tokens ?? 0,
      };
    } catch {
      return { input: 0, output: 0 };
    }
  }

  /** Quét các dòng SSE `data:` lấy usage lớn nhất (output_tokens tích luỹ trong Anthropic delta). */
  private extractUsageFromSse(raw: string): { input: number; output: number } {
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
      input = Math.max(input, u.input_tokens ?? u.prompt_tokens ?? 0);
      output = Math.max(output, u.output_tokens ?? u.completion_tokens ?? 0);
    }
    return { input, output };
  }

  /** Trừ token cho nhánh stream — controller gọi sau khi gom toàn bộ SSE đã bơm cho client. */
  async finalizeStream(subId: string, raw: string): Promise<void> {
    const { input, output } = this.extractUsageFromSse(raw);
    if (input + output > 0) {
      const sub = await this.subs.findById(subId).catch(() => null);
      await this.subs.deductTokens(subId, input, output).catch(() => {});
      if (sub) this.stats.logTokenUsage(subId, sub.userId, input, output).catch(() => {});
    }
  }
}

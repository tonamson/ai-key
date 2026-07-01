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

    // 2 tweak request tối thiểu (bắt buộc, không phải "transform response"):
    // 1) Strip context_management: Claude Code gửi strategy clear_thinking_20251015 đòi thinking
    //    enabled → upstream 400. Field này client khác không có nên vô hại.
    // 2) OpenAI chat/completions khi stream MẶC ĐỊNH không trả usage → không đếm được token
    //    (user xài free). Ép stream_options.include_usage=true để chunk cuối có usage.
    //    Anthropic/Responses stream luôn có usage sẵn nên không cần.
    let outBody = body;
    if (outBody && method !== 'GET') {
      if (outBody.context_management) outBody = { ...outBody, context_management: undefined };
      if (path.includes('/chat/completions') && outBody.stream === true) {
        outBody = { ...outBody, stream_options: { ...(outBody.stream_options ?? {}), include_usage: true } };
      }
    }
    const upstreamBody = outBody && method !== 'GET' ? JSON.stringify(outBody) : undefined;

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

  /**
   * Chuẩn hoá 1 object usage về {input, output} cho mọi format:
   *  - Anthropic: input_tokens + cache_creation_input_tokens + cache_read_input_tokens (cache = tiền thật),
   *    output_tokens.
   *  - OpenAI (chat/completions): prompt_tokens / completion_tokens.
   *  - Responses API (Codex): input_tokens / output_tokens (giống Anthropic keys).
   * Trả null nếu object không phải usage (không có field token nào) để caller bỏ qua.
   */
  private readUsage(u: any): { input: number; output: number } | null {
    if (!u || typeof u !== 'object') return null;
    const input =
      (u.input_tokens ?? u.prompt_tokens ?? 0) +
      (u.cache_creation_input_tokens ?? 0) +
      (u.cache_read_input_tokens ?? 0);
    const output = u.output_tokens ?? u.completion_tokens ?? 0;
    if (input === 0 && output === 0 && u.input_tokens === undefined && u.prompt_tokens === undefined) return null;
    return { input, output };
  }

  /** Tìm object usage trong 1 event bất kể format (top-level, nested trong message/response). */
  private usageFromEvent(evt: any): any {
    return evt?.usage ?? evt?.message?.usage ?? evt?.response?.usage ?? null;
  }

  /** Đọc usage từ response non-stream (JSON hoặc SSE gom sẵn). Không sửa payload. */
  private extractUsageFromRaw(raw: string, contentType: string): { input: number; output: number } {
    if (contentType.includes('text/event-stream') || raw.startsWith('data:')) {
      return this.extractUsageFromSse(raw);
    }
    try {
      const obj = JSON.parse(raw);
      // JSON non-stream: usage thường top-level; Responses API để trong response.usage.
      const got = this.readUsage(obj?.usage ?? obj?.response?.usage);
      return got ?? { input: 0, output: 0 };
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
      const got = this.readUsage(this.usageFromEvent(evt));
      if (!got) continue;
      // input chốt ở giá trị lớn nhất (message_start có full input); output tích luỹ → max.
      input = Math.max(input, got.input);
      output = Math.max(output, got.output);
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

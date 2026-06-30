import { ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuotaInfo, SubscriptionsService } from '../subscriptions/subscriptions.service';
import { KeySubscription } from '../subscriptions/key-subscription.entity';
import { StatsService } from '../stats/stats.service';

export interface ForwardResult {
  body: any;
  isStream: boolean;
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

  /** @deprecated Use parseSseToJson — kept for reference only */
  private parseUsage(_body: any): { input: number; output: number } {
    return { input: 0, output: 0 };
  }

  private parseSseToJson(raw: string): { input: number; output: number; assembled: any } {
    let input = 0, output = 0;
    let message: any = null;
    const contentBlocks: string[] = [];

    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      let ev: any;
      try { ev = JSON.parse(data); } catch { continue; }

      if (ev.type === 'message_start') {
        message = ev.message;
        const u = ev.message?.usage;
        if (u) { input = Math.max(input, u.input_tokens ?? 0); output = Math.max(output, u.output_tokens ?? 0); }
      }
      if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
        const idx = ev.index ?? 0;
        contentBlocks[idx] = (contentBlocks[idx] ?? '') + (ev.delta.text ?? '');
      }
      if (ev.type === 'message_delta') {
        const u = ev.usage;
        if (u) { output = Math.max(output, u.output_tokens ?? 0); }
        if (message && ev.delta) Object.assign(message, ev.delta);
      }
    }

    const assembled = message ? {
      ...message,
      content: contentBlocks.map((text, i) => ({ type: 'text', text })).filter(Boolean),
      usage: { input_tokens: input, output_tokens: output },
    } : { error: 'empty response' };

    return { input, output, assembled };
  }

  async forward(nineRouterKey: string, path: string, method: string, body: any): Promise<ForwardResult> {
    const sub = await this.subs.findActiveByKey(nineRouterKey);
    if (!sub) throw new UnauthorizedException('Key không hợp lệ hoặc hết hạn');
    if (sub.expiresAt < new Date()) throw new ForbiddenException('Subscription đã hết hạn');

    const pre = this.subs.getQuotaInfo(sub);
    if (pre.remainingTotal <= 0) throw new HttpException('Quota đã hết', 429);
    if (pre.remainingPeriod <= 0) throw new HttpException('Đã đạt giới hạn token theo giờ', 429);

    const isUserStream = body?.stream === true;

    // Always request stream from 9Router — SSE token counts are accurate.
    // 9Router non-stream adds a fake BUFFER_TOKENS=2000 to input_tokens; stream path does not.
    // Strip context_management: Claude Code sends clear_thinking_20251015 strategy which
    // requires thinking enabled — upstream doesn't support it.
    const upstreamBody = (body && method !== 'GET')
      ? JSON.stringify({ ...body, stream: true, context_management: undefined })
      : undefined;

    const res = await fetch(`${this.nineRouterBase}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nineRouterKey}` },
      body: upstreamBody,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new HttpException(err, res.status);
    }

    const contentType = res.headers.get('content-type') ?? '';

    if (isUserStream && contentType.includes('text/event-stream')) {
      // Pass SSE stream through — controller handles deduction via finalizeStream
      return { body: res, isStream: true, quota: pre, sub };
    }

    // Non-stream requested by user OR unexpected non-stream from 9Router:
    // Consume the SSE stream internally, extract accurate token counts, build JSON response.
    const rawSse = await res.text();
    const { input, output, assembled } = this.parseSseToJson(rawSse);

    const quota = input + output > 0
      ? await this.subs.deductTokens(sub.id, input, output).catch(() => this.subs.getQuotaInfo(sub))
      : this.subs.getQuotaInfo(sub);
    if (input + output > 0) this.stats.logTokenUsage(sub.id, sub.userId, input, output).catch(() => {});

    return { body: assembled, isStream: false, quota, sub };
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

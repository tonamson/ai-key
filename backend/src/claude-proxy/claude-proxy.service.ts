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

  /**
   * Upstream (9Router) thêm hậu tố "_ide" vào tool name trong response (vd get_weather -> get_weather_ide),
   * khiến client (Claude Code) không nhận ra tool -> "tool unavailable". Bóc lại hậu tố, nhưng CHỈ khi
   * tên-đã-bóc khớp một tool client thực sự gửi lên — tránh đụng tool có tên hợp lệ kết thúc "_ide".
   * ponytail: chỉ xử lý hậu tố "_ide". Mở rộng sang hậu tố khác nếu upstream đổi hành vi.
   */
  stripInjectedToolSuffix(text: string, validNames: Set<string>): string {
    if (!validNames.size || !text.includes('_ide')) return text;
    return text.replace(/"name":"([A-Za-z0-9_.-]+?)_ide"/g, (m, base) =>
      validNames.has(base) ? `"name":"${base}"` : m);
  }

  private parseSseToJson(raw: string): { input: number; output: number; assembled: any } {
    let input = 0, output = 0;
    let message: any = null;
    // Per-index block being assembled. text/thinking accumulate strings; tool_use accumulates partial_json.
    const blocks: any[] = [];
    const toolJson: string[] = [];

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
      if (ev.type === 'content_block_start') {
        const idx = ev.index ?? 0;
        // Clone the starting block (carries tool_use id/name, text "", thinking, etc.)
        blocks[idx] = { ...ev.content_block };
        toolJson[idx] = '';
      }
      if (ev.type === 'content_block_delta') {
        const idx = ev.index ?? 0;
        const d = ev.delta ?? {};
        if (!blocks[idx]) blocks[idx] = { type: 'text', text: '' };
        if (d.type === 'text_delta') blocks[idx].text = (blocks[idx].text ?? '') + (d.text ?? '');
        else if (d.type === 'thinking_delta') blocks[idx].thinking = (blocks[idx].thinking ?? '') + (d.thinking ?? '');
        else if (d.type === 'signature_delta') blocks[idx].signature = (blocks[idx].signature ?? '') + (d.signature ?? '');
        else if (d.type === 'input_json_delta') toolJson[idx] = (toolJson[idx] ?? '') + (d.partial_json ?? '');
      }
      if (ev.type === 'content_block_stop') {
        const idx = ev.index ?? 0;
        if (blocks[idx]?.type === 'tool_use') {
          try { blocks[idx].input = JSON.parse(toolJson[idx] || '{}'); } catch { blocks[idx].input = {}; }
        }
      }
      if (ev.type === 'message_delta') {
        const u = ev.usage;
        if (u) { output = Math.max(output, u.output_tokens ?? 0); }
        if (message && ev.delta) Object.assign(message, ev.delta);
      }
    }

    const assembled = message ? {
      ...message,
      content: blocks.filter(Boolean),
      usage: { input_tokens: input, output_tokens: output },
    } : { error: 'empty response' };

    return { input, output, assembled };
  }

  async forward(nineRouterKey: string, path: string, method: string, body: any, clientHeaders: Record<string, any> = {}): Promise<ForwardResult> {
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

    // Forward client identity headers so 9Router detects Claude Code (clientDetector.js uses
    // user-agent / x-app) and takes its lossless passthrough path. Without these it treats us as
    // an unknown client and cloaks tool names with an "_ide" suffix → client can't match tools.
    const fwd = (k: string) => clientHeaders[k] ?? clientHeaders[k.toLowerCase()];
    const passHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${nineRouterKey}`,
    };
    for (const h of ['user-agent', 'x-app', 'anthropic-version', 'anthropic-beta', 'x-stainless-lang']) {
      const v = fwd(h);
      if (v) passHeaders[h] = String(v);
    }
    const res = await fetch(`${this.nineRouterBase}${path}`, {
      method,
      headers: passHeaders,
      body: upstreamBody,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new HttpException(err, res.status);
    }

    const contentType = res.headers.get('content-type') ?? '';
    const branch = isUserStream && contentType.includes('text/event-stream') ? 'passthrough' : 'assembly';

    if (isUserStream && contentType.includes('text/event-stream')) {
      // Pass SSE stream through — controller handles deduction via finalizeStream
      return { body: res, isStream: true, quota: pre, sub };
    }

    // Non-stream requested by user OR unexpected non-stream from 9Router:
    // Consume the SSE stream internally, extract accurate token counts, build JSON response.
    const rawSse = await res.text();
    const { input, output, assembled } = this.parseSseToJson(rawSse);

    // Bóc hậu tố "_ide" do upstream chèn vào tool name (xem stripInjectedToolSuffix).
    const validNames = new Set<string>(
      (Array.isArray(body?.tools) ? body.tools : []).map((t: any) => t?.name).filter(Boolean));
    for (const b of assembled?.content ?? []) {
      if (b?.type === 'tool_use' && typeof b.name === 'string' && b.name.endsWith('_ide')) {
        const base = b.name.slice(0, -4);
        if (validNames.has(base)) b.name = base;
      }
    }

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

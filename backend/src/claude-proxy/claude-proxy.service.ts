import { ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { QuotaInfo, SubscriptionsService } from '../subscriptions/subscriptions.service';
import { KeySubscription } from '../subscriptions/key-subscription.entity';

const NINE_ROUTER_BASE = process.env.NINE_ROUTER_URL ?? 'http://103.172.78.21:20128/v1';

export interface ForwardResult {
  body: any;
  isStream: boolean;
  quota: QuotaInfo;
  sub: KeySubscription;
}

@Injectable()
export class ClaudeProxyService {
  constructor(private readonly subs: SubscriptionsService) {}

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
    if (Number(sub.tokenUsed) >= Number(sub.tokenQuota)) throw new HttpException('Quota đã hết', 429);

    const res = await fetch(`${NINE_ROUTER_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nineRouterKey}` },
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('text/event-stream')) {
      // ponytail: stream token deduction — needs SSE chunk parsing to extract usage from final chunk
      const quota = this.subs.getQuotaInfo(sub);
      return { body: res, isStream: true, quota, sub };
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new HttpException(json, res.status);

    const { input, output } = this.parseUsage(json);
    const quota = input + output > 0
      ? await this.subs.deductTokens(sub.id, input, output).catch(() => this.subs.getQuotaInfo(sub))
      : this.subs.getQuotaInfo(sub);

    return { body: json, isStream: false, quota, sub };
  }
}

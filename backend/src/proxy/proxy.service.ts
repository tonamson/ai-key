import { ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const NINE_ROUTER_BASE = 'http://103.172.78.21:20128/v1';

@Injectable()
export class ProxyService {
  constructor(private readonly subs: SubscriptionsService) {}

  private parseUsage(body: any): { input: number; output: number } {
    const usage = body?.usage;
    return {
      input: usage?.input_tokens ?? usage?.prompt_tokens ?? 0,
      output: usage?.output_tokens ?? usage?.completion_tokens ?? 0,
    };
  }

  async forward(nineRouterKey: string, path: string, method: string, headers: any, body: any): Promise<any> {
    const sub = await this.subs.findActiveByKey(nineRouterKey);
    if (!sub) throw new UnauthorizedException('Key không hợp lệ hoặc hết hạn');
    if (sub.expiresAt < new Date()) throw new ForbiddenException('Subscription đã hết hạn');
    if (Number(sub.tokenUsed) >= Number(sub.tokenQuota)) throw new HttpException('Quota đã hết', 429);

    const url = `${NINE_ROUTER_BASE}${path}`;
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${nineRouterKey}`,
    };

    const res = await fetch(url, {
      method,
      headers: forwardHeaders,
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('text/event-stream')) {
      // ponytail: streaming passthrough — return response for controller to pipe
      return res;
    }

    const json = await res.json().catch(() => ({}));
    const { input, output } = this.parseUsage(json);
    if (input + output > 0) {
      await this.subs.deductTokens(sub.id, input, output).catch(() => {});
    }

    if (!res.ok) throw new HttpException(json, res.status);
    return json;
  }
}

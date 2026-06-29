import { All, Controller, Get, Headers, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ClaudeProxyService } from './claude-proxy.service';
import { Public } from '../auth/decorators/public.decorator';
import type { QuotaInfo } from '../subscriptions/subscriptions.service';

@Public()
@Controller('claude/v1')
export class ClaudeProxyController {
  constructor(private readonly service: ClaudeProxyService) {}

  // Explicit routes needed — NestJS wildcard @All('*') doesn't catch all POST paths reliably
  @Post('chat/completions')
  chatCompletions(@Req() req: Request, @Res() res: Response, @Headers('authorization') auth: string) {
    return this.handle(req, res, auth, '/chat/completions');
  }

  @Post('messages')
  messages(@Req() req: Request, @Res() res: Response, @Headers('authorization') auth: string) {
    return this.handle(req, res, auth, '/messages');
  }

  @Post('messages/count_tokens')
  countTokens(@Req() req: Request, @Res() res: Response, @Headers('authorization') auth: string) {
    return this.handle(req, res, auth, '/messages/count_tokens');
  }

  @Get('models')
  models(@Req() req: Request, @Res() res: Response, @Headers('authorization') auth: string) {
    return this.handle(req, res, auth, '/models');
  }

  // Catch-all for other paths
  @All('*')
  catchAll(@Req() req: Request, @Res() res: Response, @Headers('authorization') auth: string) {
    const path = '/' + ((req.params as any)[0] ?? '');
    return this.handle(req, res, auth, path);
  }

  private async handle(req: Request, res: Response, auth: string, path: string) {
    const nineRouterKey = auth?.replace(/^Bearer\s+/i, '') ?? '';
    const body = req.method !== 'GET' ? req.body : undefined;

    const result = await this.service.forward(nineRouterKey, path, req.method, body);
    this.setQuotaHeaders(res, result.quota);

    if (result.isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const reader = (result.body as { body: ReadableStream }).body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); break; }
          res.write(Buffer.from(value));
        }
      };
      pump().catch(() => res.end());
      return;
    }

    res.json(result.body);
  }

  private setQuotaHeaders(res: Response, q: QuotaInfo) {
    res.setHeader('x-ratelimit-limit-tokens', String(q.limitPeriod));
    res.setHeader('x-ratelimit-remaining-tokens', String(q.remainingPeriod));
    res.setHeader('x-ratelimit-reset-tokens', q.resetAt.toISOString());
    res.setHeader('x-ratelimit-limit-requests', String(q.limitTotal));
    res.setHeader('x-ratelimit-remaining-requests', String(q.remainingTotal));
    res.setHeader('anthropic-ratelimit-tokens-limit', String(q.limitPeriod));
    res.setHeader('anthropic-ratelimit-tokens-remaining', String(q.remainingPeriod));
    res.setHeader('anthropic-ratelimit-tokens-reset', q.resetAt.toISOString());
  }
}

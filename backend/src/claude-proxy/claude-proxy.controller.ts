import { All, Controller, Headers, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ClaudeProxyService } from './claude-proxy.service';
import { Public } from '../auth/decorators/public.decorator';
import type { QuotaInfo } from '../subscriptions/subscriptions.service';

@Public()
@Controller('v1')
export class ClaudeProxyController {
  constructor(private readonly service: ClaudeProxyService) {}

  // Explicit POST routes — NestJS wildcard @All('*') doesn't catch all POST paths reliably.
  @Post('chat/completions')
  @HttpCode(200) // Anthropic/Claude CLI expect 200 (NestJS defaults POST to 201 → client retries)
  chatCompletions(@Req() req: Request, @Res() res: Response, @Headers('x-api-key') apiKey: string) {
    return this.handle(req, res, apiKey, '/chat/completions');
  }

  @Post('messages')
  @HttpCode(200)
  messages(@Req() req: Request, @Res() res: Response, @Headers('x-api-key') apiKey: string) {
    return this.handle(req, res, apiKey, '/messages');
  }

  @Post('messages/count_tokens')
  @HttpCode(200)
  countTokens(@Req() req: Request, @Res() res: Response, @Headers('x-api-key') apiKey: string) {
    return this.handle(req, res, apiKey, '/messages/count_tokens');
  }

  // Catch-all — forward mọi path còn lại (models, responses, embeddings, ...) verbatim lên 9Router.
  @All('*path')
  catchAll(@Req() req: Request, @Res() res: Response, @Headers('x-api-key') apiKey: string) {
    const path = '/' + ((req.params as any)['path'] ?? '');
    return this.handle(req, res, apiKey, path);
  }

  private async handle(req: Request, res: Response, apiKey: string, path: string) {
    const auth = req.headers['authorization'] as string | undefined;
    const nineRouterKey = apiKey || (auth?.startsWith('Bearer ') ? auth.slice(7) : '') || '';
    const body = req.method !== 'GET' ? req.body : undefined;

    const result = await this.service.forward(nineRouterKey, path, req.method, body, req.headers as Record<string, any>);
    this.setQuotaHeaders(res, result.quota);

    if (result.isStream) {
      res.setHeader('Content-Type', result.contentType || 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // tell nginx not to buffer SSE
      (res as any).flushHeaders?.();
      const reader = (result.body as { body: ReadableStream }).body.getReader();
      const decoder = new TextDecoder();
      // Trừ token dựa trên những gì ĐÃ nhận từ upstream, kể cả khi client ngắt giữa chừng.
      // Không finalize = 9Router đã tốn tiền thật nhưng user xài free → token leak.
      let captured = '';
      let finalized = false;
      const finalize = async () => {
        if (finalized) return;
        finalized = true;
        await this.service.finalizeStream(result.sub.id, captured).catch(() => {});
      };
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          captured += chunk;
          res.write(chunk); // verbatim — không transform
        }
        await finalize();
        res.end();
      };
      res.on('close', () => { reader.cancel().catch(() => {}); finalize(); });
      pump().catch(async () => { await finalize(); res.end(); });
      return;
    }

    // Non-stream: echo body verbatim với đúng Content-Type upstream.
    if (result.contentType) res.setHeader('Content-Type', result.contentType);
    res.send(result.body);
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

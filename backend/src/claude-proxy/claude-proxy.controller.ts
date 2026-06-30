import { All, Controller, Get, Headers, HttpCode, Post, Req, Res } from '@nestjs/common';
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
  @HttpCode(200) // NestJS defaults POST to 201; Anthropic/Claude CLI expect 200 or it retries
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

  @Get('models')
  models(@Res() res: Response) {
    // 9router doesn't support /models — return static list so Claude CLI doesn't 405
    res.json({
      object: 'list',
      data: [
        { id: 'cc/claude-opus-4-8', object: 'model', created: 1749600000, owned_by: 'anthropic' },
        { id: 'cc/claude-sonnet-4-6', object: 'model', created: 1749600000, owned_by: 'anthropic' },
        { id: 'cc/claude-haiku-4-5-20251001', object: 'model', created: 1749600000, owned_by: 'anthropic' },
      ],
    });
  }

  // Catch-all for other paths
  @All('*path')
  catchAll(@Req() req: Request, @Res() res: Response, @Headers('x-api-key') apiKey: string) {
    const path = '/' + ((req.params as any)['path'] ?? '');
    return this.handle(req, res, apiKey, path);
  }

  private async handle(req: Request, res: Response, apiKey: string, path: string) {
    const nineRouterKey = apiKey ?? '';
    const body = req.method !== 'GET' ? req.body : undefined;

    const result = await this.service.forward(nineRouterKey, path, req.method, body, req.headers as Record<string, any>);
    this.setQuotaHeaders(res, result.quota);

    if (result.isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // tell nginx not to buffer SSE
      (res as any).flushHeaders?.();
      const reader = (result.body as { body: ReadableStream }).body.getReader();
      const decoder = new TextDecoder();
      // Bóc hậu tố "_ide" upstream chèn vào tool name. SSE phân tách theo dòng và name luôn
      // nằm gọn trong một dòng `data:`, nên buffer theo dòng rồi strip từng dòng hoàn chỉnh.
      const validNames = new Set<string>(
        (Array.isArray(body?.tools) ? body.tools : []).map((t: any) => t?.name).filter(Boolean));
      let captured = '';
      let buf = '';
      let finalized = false;
      // Trừ token dựa trên những gì ĐÃ nhận từ upstream, kể cả khi client ngắt giữa chừng.
      // Không finalize = 9Router đã tốn tiền thật nhưng user xài free → token leak.
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
          buf += chunk;
          const nl = buf.lastIndexOf('\n');
          if (nl === -1) continue;
          const ready = buf.slice(0, nl + 1);
          buf = buf.slice(nl + 1);
          res.write(this.service.stripInjectedToolSuffix(ready, validNames));
        }
        if (buf) res.write(this.service.stripInjectedToolSuffix(buf, validNames));
        await finalize();
        res.end();
      };
      // Client ngắt kết nối giữa stream → vẫn trừ token theo phần upstream đã trả.
      res.on('close', () => { reader.cancel().catch(() => {}); finalize(); });
      pump().catch(async () => { await finalize(); res.end(); });
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

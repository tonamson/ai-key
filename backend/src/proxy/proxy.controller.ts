import { All, Controller, Headers, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('proxy/v1')
export class ProxyController {
  constructor(private readonly service: ProxyService) {}

  @All('*')
  async forward(@Req() req: Request, @Res() res: Response, @Headers('authorization') auth: string) {
    const nineRouterKey = auth?.replace(/^Bearer\s+/i, '') ?? '';
    const path = '/' + (req.params as any)[0];
    const body = req.method !== 'GET' ? req.body : undefined;

    const result = await this.service.forward(nineRouterKey, path, req.method, req.headers, body);

    // Streaming response
    if (result && typeof result.body?.pipe === 'function') {
      res.setHeader('Content-Type', 'text/event-stream');
      (result.body as any).pipe(res);
      return;
    }

    res.json(result);
  }
}

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from './activity-log.service';
import { ActivityAction } from './activity-log.entity';

const METHOD_ACTION: Record<string, ActivityAction> = {
  POST: ActivityAction.CREATE,
  PATCH: ActivityAction.UPDATE,
  PUT: ActivityAction.UPDATE,
  DELETE: ActivityAction.DELETE,
  GET: ActivityAction.VIEW,
};

const PATH_ACTION_OVERRIDES: Array<[RegExp, ActivityAction]> = [
  [/\/auth\/login$/, ActivityAction.LOGIN],
  [/\/auth\/register$/, ActivityAction.LOGIN],
  [/\/2fa\/verify$/, ActivityAction.LOGIN],
  [/\/auth\/logout$/, ActivityAction.LOGOUT],
];

const SKIP_PATTERNS = [
  /\/auth\/me$/,
  /\/auth\/role-keys$/,
  /\/auth\/permissions$/,
  /\/admin\/activity-logs/,
  /\/health$/,
];

// Fields bị xóa khỏi log trước khi lưu — không bao giờ ghi vào DB
const SENSITIVE_KEYS = new Set([
  'password', 'newPassword', 'currentPassword',
  'twoFactorSecret', 'accessToken', 'token', 'tempToken',
  'secret', 'otpauthUrl',
]);

/** Xóa đệ quy các field nhạy cảm khỏi object bất kỳ */
function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 4 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.slice(0, 20).map(i => sanitize(i, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEYS.has(k) ? '[REDACTED]' : sanitize(v, depth + 1);
  }
  return out;
}

/** List response lớn → chỉ lưu tóm tắt, tránh jsonb phình to */
function summarizeResponse(body: unknown): unknown {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const b = body as Record<string, unknown>;
    // Dạng { items: [...], total, page, limit }
    if (Array.isArray(b.items)) {
      return {
        total: b.total,
        count: (b.items as unknown[]).length,
        ids: (b.items as Record<string, unknown>[]).map(i => i.id).filter(Boolean).slice(0, 50),
      };
    }
  }
  if (Array.isArray(body)) {
    return {
      count: body.length,
      ids: (body as Record<string, unknown>[]).map(i => i.id).filter(Boolean).slice(0, 50),
    };
  }
  return sanitize(body);
}

function resolveModule(path: string): string {
  const segments = path.replace(/^\//, '').split('/');
  const meaningful = segments.filter(s => !/^[0-9a-f-]{8,}$/i.test(s) && s !== 'admin' && s !== 'auth');
  return meaningful[0] ?? segments[0] ?? 'unknown';
}

function resolveAction(method: string, path: string): ActivityAction {
  for (const [pattern, action] of PATH_ACTION_OVERRIDES) {
    if (pattern.test(path)) return action;
  }
  return METHOD_ACTION[method.toUpperCase()] ?? ActivityAction.VIEW;
}

function resolveIp(ip: unknown): string | undefined {
  const raw = Array.isArray(ip) ? ip[0] : ip;
  return typeof raw === 'string' ? raw.replace('::ffff:', '') : undefined;
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly logService: ActivityLogService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const { method, url, ip, user, body: reqBody, headers } = req;
    const path = url.split('?')[0];
    const startMs = Date.now();

    if (SKIP_PATTERNS.some(p => p.test(path))) return next.handle();

    const action = resolveAction(method, path);
    const ipAddress = resolveIp(ip);
    const userAgent = typeof headers['user-agent'] === 'string' ? headers['user-agent'].slice(0, 200) : undefined;

    const segments = path.split('/');
    const lastSeg = segments[segments.length - 1];
    const targetId = /^[0-9a-f-]{8,}$/i.test(lastSeg) ? lastSeg : undefined;

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const userId: string | undefined =
            user?.id ?? responseBody?.user?.id ?? responseBody?.id ?? undefined;

          const metadata: Record<string, unknown> = {
            durationMs: Date.now() - startMs,
            userAgent,
            response: summarizeResponse(responseBody),
          };

          // Lưu request body cho write operations (POST/PATCH/PUT)
          if (['POST', 'PATCH', 'PUT'].includes(method.toUpperCase()) && reqBody && Object.keys(reqBody).length) {
            metadata.requestBody = sanitize(reqBody);
          }

          this.logService.log({ userId, action, module: resolveModule(path), targetId, metadata, ipAddress })
            .catch(() => { /* never let logging break the response */ });
        },

        // Lỗi 401/403/4xx — log để phát hiện probing / brute-force / khai thác thất bại
        error: (err) => {
          const statusCode: number = err?.status ?? err?.statusCode ?? 500;
          // Chỉ log lỗi client (4xx), bỏ qua 5xx server error để tránh spam
          if (statusCode < 400 || statusCode >= 500) return;

          const userId: string | undefined = user?.id ?? undefined;
          const metadata: Record<string, unknown> = {
            durationMs: Date.now() - startMs,
            userAgent,
            statusCode,
            errorMessage: err?.message ?? 'unknown',
            // Lưu email khi login thất bại để theo dõi brute-force
            ...(action === ActivityAction.LOGIN && reqBody?.email ? { attemptedEmail: reqBody.email } : {}),
          };

          this.logService.log({ userId, action, module: resolveModule(path), targetId, metadata, ipAddress })
            .catch(() => {});
        },
      }),
    );
  }
}

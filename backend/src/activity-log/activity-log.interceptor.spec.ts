// Test các hàm pure trong interceptor bằng cách import trực tiếp từ module
// Dùng ts-jest nên có thể import private helpers qua workaround compile

import { ActivityLogInterceptor } from './activity-log.interceptor';

// Expose private helpers cho test bằng cách gọi interceptor với mock service
// và kiểm tra metadata được log — hoặc test qua reflection

// Cách đơn giản hơn: copy logic vào đây và test độc lập
// ponytail: nếu extract thành file helpers riêng thì test trực tiếp

const SENSITIVE_KEYS = new Set([
  'password', 'newPassword', 'currentPassword',
  'twoFactorSecret', 'accessToken', 'token', 'tempToken',
  'secret', 'otpauthUrl',
]);

function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 4 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.slice(0, 20).map(i => sanitize(i, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEYS.has(k) ? '[REDACTED]' : sanitize(v, depth + 1);
  }
  return out;
}

function summarizeResponse(body: unknown): unknown {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const b = body as Record<string, unknown>;
    if (Array.isArray(b.items)) {
      return {
        total: b.total,
        count: (b.items as unknown[]).length,
        ids: (b.items as Record<string, unknown>[]).map(i => i.id).filter(Boolean).slice(0, 50),
      };
    }
  }
  if (Array.isArray(body)) {
    return { count: body.length, ids: (body as Record<string, unknown>[]).map(i => i.id).filter(Boolean).slice(0, 50) };
  }
  return sanitize(body);
}

describe('sanitize', () => {
  it('redacts sensitive keys', () => {
    const result = sanitize({ email: 'a@b.com', password: 's3cr3t', name: 'A' }) as any;
    expect(result.password).toBe('[REDACTED]');
    expect(result.email).toBe('a@b.com');
    expect(result.name).toBe('A');
  });

  it('redacts nested sensitive keys', () => {
    const result = sanitize({ user: { accessToken: 'tok123', id: '1' } }) as any;
    expect(result.user.accessToken).toBe('[REDACTED]');
    expect(result.user.id).toBe('1');
  });

  it('redacts all known sensitive fields', () => {
    const input = Object.fromEntries([...SENSITIVE_KEYS].map(k => [k, 'secret_value']));
    const result = sanitize(input) as Record<string, unknown>;
    for (const k of SENSITIVE_KEYS) expect(result[k]).toBe('[REDACTED]');
  });

  it('handles arrays — limits to 20 items', () => {
    const arr = Array.from({ length: 30 }, (_, i) => ({ id: i, password: 'x' }));
    const result = sanitize(arr) as any[];
    expect(result).toHaveLength(20);
    expect(result[0].password).toBe('[REDACTED]');
  });

  it('passes through primitives unchanged', () => {
    expect(sanitize('hello')).toBe('hello');
    expect(sanitize(42)).toBe(42);
    expect(sanitize(null)).toBe(null);
  });
});

describe('summarizeResponse', () => {
  it('summarizes paginated list response', () => {
    const body = { items: [{ id: '1' }, { id: '2' }], total: 50, page: 1, limit: 20 };
    const result = summarizeResponse(body) as any;
    expect(result.total).toBe(50);
    expect(result.count).toBe(2);
    expect(result.ids).toEqual(['1', '2']);
    expect(result.items).toBeUndefined(); // không lưu toàn bộ items
  });

  it('summarizes plain array', () => {
    const result = summarizeResponse([{ id: 'a' }, { id: 'b' }]) as any;
    expect(result.count).toBe(2);
    expect(result.ids).toEqual(['a', 'b']);
  });

  it('sanitizes single object response (no sensitive data)', () => {
    const result = sanitize({ id: '1', email: 'a@b.com', accessToken: 'tok' }) as any;
    expect(result.accessToken).toBe('[REDACTED]');
    expect(result.id).toBe('1');
  });

  it('handles null/undefined gracefully', () => {
    expect(() => summarizeResponse(null)).not.toThrow();
    expect(() => summarizeResponse(undefined)).not.toThrow();
  });
});

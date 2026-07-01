import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NineRouterService {
  private readonly base: string;
  private readonly password: string;
  private cookie: string | null = null;

  constructor(private readonly config: ConfigService) {
    // Strip /v1 suffix — NineRouterService calls management API (/api/*), not the proxy endpoint
    this.base = config.getOrThrow('NINE_ROUTER_URL').replace(/\/v1\/?$/, '').replace(/\/$/, '');
    this.password = config.getOrThrow('NINE_ROUTER_PASSWORD');
  }

  private async login(): Promise<string> {
    const res = await fetch(`${this.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: this.password }),
    });
    if (!res.ok) throw new InternalServerErrorException('9router login failed');
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) throw new InternalServerErrorException('9router: no session cookie');
    // Extract the cookie value (name=value part only)
    this.cookie = setCookie.split(';')[0];
    return this.cookie;
  }

  private async fetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const doRequest = async (cookie: string) =>
      fetch(`${this.base}${path}`, {
        ...init,
        headers: { ...(init.headers ?? {}), Cookie: cookie, 'Content-Type': 'application/json' },
      });

    let cookie = this.cookie ?? await this.login();
    let res = await doRequest(cookie);

    // Session expired — re-login once
    if (res.status === 401 || res.status === 403) {
      cookie = await this.login();
      res = await doRequest(cookie);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new InternalServerErrorException(body.error ?? '9router error');
    }
    return res.json();
  }

  listKeys() {
    return this.fetch<{ keys: any[] }>('/api/keys').then(r => r.keys);
  }

  createKey(name: string) {
    return this.fetch<{ key: string; name: string; id: string }>('/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  getKey(id: string) {
    return this.fetch<{ key: any }>(`/api/keys/${id}`).then(r => r.key);
  }

  updateKey(id: string, isActive: boolean) {
    return this.fetch<{ key: any }>(`/api/keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }).then(r => r.key);
  }

  deleteKey(id: string) {
    return this.fetch<{ message: string }>(`/api/keys/${id}`, { method: 'DELETE' });
  }

  async listModels(): Promise<any[]> {
    const raw = await this.fetch<any>('/api/models');
    return Array.isArray(raw) ? raw : (raw.models ?? raw.data ?? []);
  }
}

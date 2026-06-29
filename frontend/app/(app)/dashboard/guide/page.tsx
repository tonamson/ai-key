'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:2053').replace(/\/$/, '');
const PROXY_URL = `${API_BASE}/claude/v1`;

const CC_MODELS = [
  { id: 'cc/claude-opus-4-8',           label: 'Claude Opus 4.8',   tier: 'Mạnh nhất' },
  { id: 'cc/claude-opus-4-7',           label: 'Claude Opus 4.7',   tier: 'Opus' },
  { id: 'cc/claude-opus-4-6',           label: 'Claude Opus 4.6',   tier: 'Opus' },
  { id: 'cc/claude-sonnet-4-6',         label: 'Claude Sonnet 4.6', tier: 'Khuyên dùng' },
  { id: 'cc/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', tier: 'Sonnet' },
  { id: 'cc/claude-opus-4-5-20251101',  label: 'Claude Opus 4.5',   tier: 'Opus' },
  { id: 'cc/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5',  tier: 'Nhanh/Rẻ' },
];

const TIER_COLOR: Record<string, string> = {
  'Mạnh nhất':   'bg-purple-100 text-purple-700 border-purple-200',
  'Khuyên dùng': 'bg-blue-100 text-blue-700 border-blue-200',
  'Opus':        'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Sonnet':      'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Nhanh/Rẻ':    'bg-green-100 text-green-700 border-green-200',
};

const SETTINGS_JSON = JSON.stringify({
  env: {
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    ANTHROPIC_BASE_URL: PROXY_URL,
    ANTHROPIC_AUTH_TOKEN: 'sk-xxxxxxxx-xxxxxx-xxxxxxxx',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'cc/claude-opus-4-8',
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'cc/claude-sonnet-4-6',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'cc/claude-haiku-4-5-20251001',
  },
  model: 'sonnet',
}, null, 2);

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative group rounded-lg bg-zinc-950 border border-zinc-800">
      <Button size="icon" variant="ghost"
        className="absolute right-2 top-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white hover:bg-zinc-800"
        onClick={copy}>
        {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
      </Button>
      <pre className="overflow-x-auto p-4 text-sm text-zinc-200 font-mono leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

export default function GuidePage() {
  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Đã copy');
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold">Hướng dẫn tích hợp</h1>
        <p className="text-sm text-muted-foreground mt-1">Kết nối Claude Code với API Key của bạn</p>
      </div>

      {/* Models */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          <h2 className="font-semibold">Models hỗ trợ</h2>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {CC_MODELS.map(m => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border bg-background px-4 py-2.5 gap-3">
              <code className="text-xs font-mono text-muted-foreground truncate">{m.id}</code>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium hidden sm:block">{m.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TIER_COLOR[m.tier]}`}>{m.tier}</span>
                <Button variant="ghost" size="icon" className="size-6" onClick={() => copy(m.id)}>
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="size-4 text-primary" />
          <h2 className="font-semibold">Cài đặt Claude Code</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Mở file <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">~/.claude/settings.json</code> và paste nội dung sau. Thay <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">ANTHROPIC_AUTH_TOKEN</code> bằng key thật của bạn ở trang <a href="/dashboard/keys" className="text-primary underline">Keys của tôi</a>:
        </p>
        <CodeBlock code={SETTINGS_JSON} />
        <p className="text-sm text-muted-foreground">Lưu file và khởi động lại Claude Code là xong — cấu hình này tự động load mỗi lần mở.</p>
      </div>

      {/* Info table */}
      <div className="rounded-lg border bg-background divide-y text-sm">
        {[
          { label: 'ANTHROPIC_BASE_URL', value: PROXY_URL },
          { label: 'ANTHROPIC_DEFAULT_SONNET_MODEL', value: 'cc/claude-sonnet-4-6' },
          { label: 'ANTHROPIC_DEFAULT_OPUS_MODEL', value: 'cc/claude-opus-4-8' },
          { label: 'ANTHROPIC_DEFAULT_HAIKU_MODEL', value: 'cc/claude-haiku-4-5-20251001' },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground shrink-0">{row.label}</span>
            <div className="flex items-center gap-2 min-w-0">
              <code className="text-xs font-mono truncate">{row.value}</code>
              <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => copy(row.value)}>
                <Copy className="size-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

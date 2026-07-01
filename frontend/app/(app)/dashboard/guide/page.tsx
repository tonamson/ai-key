"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Settings,
  Zap,
  BookOpen,
  Terminal,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2053"
).replace(/\/$/, "");
// Claude Code tự ghép "/v1/messages" vào ANTHROPIC_BASE_URL → base phải dừng ở /claude.
// curl/SDK tự ghép "/messages" → cần đủ /claude/v1. Hai client ghép khác nhau nên tách 2 biến.
const PROXY_BASE = `${API_BASE}/claude`;
const PROXY_URL = `${PROXY_BASE}/v1`;

type RouterModel = {
  provider: string;
  model: string;
  name: string;
  fullModel: string;
  alias: string;
  caps: { vision?: boolean; search?: boolean; reasoning?: boolean };
};

const SETTINGS_JSON = JSON.stringify(
  {
    env: {
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
      ANTHROPIC_BASE_URL: PROXY_BASE,
      ANTHROPIC_AUTH_TOKEN: "sk-xxxxxxxx-xxxxxx-xxxxxxxx",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "cc/claude-opus-4-8",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "cc/claude-sonnet-4-6",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "cc/claude-haiku-4-5-20251001",
    },
    model: "sonnet",
  },
  null,
  2,
);

const CURL_EXAMPLE = `curl ${PROXY_URL}/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "cc/claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Hello!" }
    ]
  }'`;

const SDK_EXAMPLE = `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  baseURL: "${PROXY_URL}",
  apiKey: "YOUR_API_KEY",
});

const response = await client.messages.create({
  model: "cc/claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.content[0].text);`;

const TROUBLESHOOTING = [
  {
    q: "401 Unauthorized",
    a: "API Key không hợp lệ hoặc đã hết hạn. Kiểm tra lại key tại trang Keys của tôi và đảm bảo không có khoảng trắng thừa.",
  },
  {
    q: "403 Forbidden — subscription expired",
    a: "Gói dịch vụ của bạn đã hết hạn. Vào trang Mua key để gia hạn.",
  },
  {
    q: "Claude Code không nhận cấu hình",
    a: "Đảm bảo file settings.json nằm đúng ở ~/.claude/settings.json (macOS/Linux) hoặc %APPDATA%\\Claude\\settings.json (Windows). Khởi động lại Claude Code sau khi lưu.",
  },
  {
    q: "Model không tồn tại",
    a: "Dùng đúng model ID có tiền tố cc/ như trong danh sách bên dưới. Không dùng model ID gốc của Anthropic.",
  },
];

// ── Components ────────────────────────────────────────────────────────────────
function CodeBlock({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative group rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs text-zinc-500 font-mono">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? (
            <Check className="size-3.5 text-green-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Đã copy" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-zinc-200 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div className="size-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
      {n}
    </div>
  );
}

function Accordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
          {q}
        </span>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-muted-foreground pl-10">{a}</div>
      )}
    </div>
  );
}

const API_MODELS_URL = `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2053").replace(/\/$/, "")}/models`;

const CAP_LABEL: Record<string, string> = { vision: "Vision", search: "Search", reasoning: "Reasoning" };
const CAP_STYLE: Record<string, string> = {
  vision: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  search: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  reasoning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GuidePage() {
  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Đã copy");
  }

  const [codeTab, setCodeTab] = useState<"curl" | "sdk">("curl");
  const [models, setModels] = useState<RouterModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    fetch(API_MODELS_URL)
      .then(r => r.json())
      .then((raw: any) => {
        const data: RouterModel[] = Array.isArray(raw) ? raw : (raw.models ?? raw.data ?? []);
        setModels(data.filter(m => m.provider === 'cc'));
      })
      .catch(() => {})
      .finally(() => setModelsLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h1 className="text-xl font-bold">Hướng dẫn tích hợp</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Kết nối Claude Code và các ứng dụng AI với proxy API của 9Router.
        </p>
      </div>

      {/* Quick start */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Settings className="size-4 text-primary" />
          Cài đặt nhanh với Claude Code
        </h2>

        <div className="space-y-5">
          {/* Step 1 */}
          <div className="flex gap-3">
            <StepBadge n={1} />
            <div className="space-y-2 flex-1 pt-0.5">
              <p className="text-sm font-medium">Lấy API Key</p>
              <p className="text-sm text-muted-foreground">
                Vào trang{" "}
                <a
                  href="/dashboard/my-keys"
                  className="text-primary underline font-medium"
                >
                  Keys của tôi
                </a>{" "}
                để copy API Key đang hoạt động.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <StepBadge n={2} />
            <div className="space-y-2 flex-1 pt-0.5">
              <p className="text-sm font-medium">Mở file cấu hình</p>
              <p className="text-sm text-muted-foreground">
                Tạo hoặc mở file{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                  ~/.claude/settings.json
                </code>
              </p>
              <CodeBlock code="code ~/.claude/settings.json" language="bash" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <StepBadge n={3} />
            <div className="space-y-2 flex-1 pt-0.5">
              <p className="text-sm font-medium">
                Paste cấu hình và thay API Key
              </p>
              <p className="text-sm text-muted-foreground">
                Thay{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                  ANTHROPIC_AUTH_TOKEN
                </code>{" "}
                bằng key thật của bạn.
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Lưu ý: <code className="font-mono text-xs">ANTHROPIC_BASE_URL</code> kết thúc ở{" "}
                <code className="font-mono text-xs">/claude</code> — KHÔNG thêm{" "}
                <code className="font-mono text-xs">/v1</code> (Claude Code tự nối{" "}
                <code className="font-mono text-xs">/v1/messages</code>).
              </p>
              <CodeBlock code={SETTINGS_JSON} language="json" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3">
            <StepBadge n={4} />
            <div className="space-y-2 flex-1 pt-0.5">
              <p className="text-sm font-medium">
                Lưu và khởi động lại Claude Code
              </p>
              <p className="text-sm text-muted-foreground">
                Cấu hình được tự động load mỗi lần mở. Không cần thêm bước nào
                khác.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API quick reference */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Thông tin kết nối</h2>
        <div className="rounded-lg border bg-background shadow-sm divide-y text-sm">
          {[
            { label: "Base URL", value: PROXY_BASE },
            { label: "Default Sonnet", value: "cc/claude-sonnet-4-6" },
            { label: "Default Opus", value: "cc/claude-opus-4-8" },
            { label: "Default Haiku", value: "cc/claude-haiku-4-5-20251001" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <span className="text-muted-foreground shrink-0 text-xs font-medium uppercase tracking-wide w-32">
                {row.label}
              </span>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <code className="text-xs font-mono truncate text-foreground">
                  {row.value}
                </code>
              </div>
              <button
                onClick={() => copy(row.value)}
                className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Code examples */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Terminal className="size-4 text-primary" />
          Ví dụ gọi API
        </h2>
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {(["curl", "sdk"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCodeTab(tab)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${codeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab === "curl" ? "cURL" : "Node.js SDK"}
            </button>
          ))}
        </div>
        <CodeBlock
          code={codeTab === "curl" ? CURL_EXAMPLE : SDK_EXAMPLE}
          language={codeTab === "curl" ? "bash" : "typescript"}
        />
      </section>

      {/* Models */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          Models hỗ trợ
        </h2>
        {modelsLoading ? (
          <div className="rounded-lg border bg-background shadow-sm divide-y overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-56 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : models.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có model nào.</p>
        ) : (
          <div className="rounded-lg border bg-background shadow-sm overflow-hidden divide-y">
            {models.map((m) => {
              const activeCaps = Object.entries(m.caps ?? {}).filter(([, v]) => v).map(([k]) => k);
              return (
                <div
                  key={m.fullModel}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{m.name}</span>
                      {activeCaps.map(cap => (
                        <span
                          key={cap}
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CAP_STYLE[cap] ?? ''}`}
                        >
                          {CAP_LABEL[cap] ?? cap}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <code className="text-xs font-mono text-muted-foreground">{m.fullModel}</code>
                      {m.alias && m.alias !== m.fullModel && (
                        <span className="text-xs text-muted-foreground/60">alias: {m.alias}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => copy(m.fullModel)}
                    className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                    title="Copy model ID"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Troubleshooting */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <AlertCircle className="size-4 text-primary" />
          Lỗi thường gặp
        </h2>
        <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
          {TROUBLESHOOTING.map((item) => (
            <Accordion key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>
    </div>
  );
}

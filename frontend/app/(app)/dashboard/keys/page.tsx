'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Key, ShoppingCart, Coins, Calendar, CheckCircle2, AlertTriangle, XCircle, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { subscriptionApi, KeySubscription } from '@/lib/api/admin.service';

const f = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

function daysLeft(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

function StatusBadge({ days, isActive }: { days: number; isActive: boolean }) {
  if (!isActive) return <Badge variant="secondary" className="gap-1"><XCircle className="size-3" />Tạm dừng</Badge>;
  if (days <= 3) return <Badge variant="destructive" className="gap-1"><AlertTriangle className="size-3" />{days} ngày còn lại</Badge>;
  if (days <= 7) return <Badge variant="outline" className="gap-1 border-orange-400 text-orange-600 dark:text-orange-400"><AlertTriangle className="size-3" />{days} ngày còn lại</Badge>;
  return <Badge variant="secondary" className="gap-1 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"><CheckCircle2 className="size-3" />{days} ngày còn lại</Badge>;
}

function TokenBar({ used, quota }: { used: number; quota: number }) {
  const pct = Math.min(100, Math.round((used / quota) * 100));
  const color = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-orange-500' : 'bg-primary';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Coins className="size-3" />Token đã dùng</span>
        <span className="tabular-nums">{f(used)} / {f(quota)} <span className="opacity-60">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KeyCard({ sub }: { sub: KeySubscription }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const days = daysLeft(sub.expiresAt);
  const used = Number(sub.tokenUsed);
  const quota = Number(sub.tokenQuota);
  const masked = (sub as any).nineRouterKeyMasked ?? sub.nineRouterKey?.substring(0, 12) + '•••••••••';

  function copyKey() {
    navigator.clipboard.writeText(sub.nineRouterKey).then(() => {
      setCopied(true);
      toast.success('Đã sao chép API key');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Key className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{sub.order?.plan?.name ?? 'Key subscription'}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="size-3" />
              Hết hạn {new Date(sub.expiresAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
        <StatusBadge days={days} isActive={sub.isActive} />
      </div>

      {/* API Key */}
      <div className="rounded-xl bg-mresistant dark:bg-muted/50 border border-border/60 flex items-center gap-1 px-3 py-2">
        <code className="flex-1 text-xs font-mono truncate text-muted-foreground">
          {show ? sub.nineRouterKey : masked}
        </code>
        <button
          onClick={() => setShow(s => !s)}
          className="shrink-0 p-1.5 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
          title={show ? 'Ẩn key' : 'Hiện key'}
        >
          {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
        <button
          onClick={copyKey}
          className="shrink-0 p-1.5 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
          title="Sao chép"
        >
          {copied ? <CheckCircle2 className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {/* Token usage */}
      <TokenBar used={used} quota={quota} />
    </div>
  );
}

export default function KeysPage() {
  const [subs, setSubs] = useState<KeySubscription[]>([]);
  useEffect(() => {
    subscriptionApi.listMine().then(setSubs).catch(e => toast.error(e.message));
  }, []);

  const activeCount = subs.filter(s => s.isActive).length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keys của tôi</h1>
          <p className="text-muted-foreground mt-1">
            {subs.length === 0 ? 'Bạn chưa có key nào' : `${activeCount} / ${subs.length} key đang hoạt động`}
          </p>
        </div>
        <a href="/dashboard/buy" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <ShoppingCart className="size-4" /> Mua thêm
        </a>
      </div>

      {/* Empty state */}
      {subs.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed bg-card p-16 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
            <Key className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Chưa có key nào</p>
            <p className="text-sm text-muted-foreground mt-1">Mua gói đầu tiên để bắt đầu sử dụng API</p>
          </div>
          <a href="/dashboard/buy" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <ShoppingCart className="size-4" />Mua key ngay
          </a>
        </div>
      )}

      {/* Key list */}
      {subs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {subs.map(sub => <KeyCard key={sub.id} sub={sub} />)}
        </div>
      )}


    </div>
  );
}

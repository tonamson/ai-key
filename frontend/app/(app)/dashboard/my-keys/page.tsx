'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Key, ShoppingCart, Coins, Calendar, CheckCircle2, AlertTriangle, XCircle, Copy, RefreshCw, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { subscriptionApi, orderApi, KeySubscription, Order } from '@/lib/api/admin.service';
import { useConfirm } from '@/hooks/use-confirm';

const f = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

function daysLeft(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function StatusBadge({ days, isActive, expired }: { days: number; isActive: boolean; expired: boolean }) {
  if (expired) return <Badge variant="secondary" className="gap-1 text-muted-foreground"><Clock className="size-3" />Đã hết hạn</Badge>;
  if (!isActive) return <Badge variant="secondary" className="gap-1"><XCircle className="size-3" />Tạm dừng</Badge>;
  if (days <= 3) return <Badge variant="destructive" className="gap-1"><AlertTriangle className="size-3" />{days} ngày còn lại</Badge>;
  if (days <= 7) return <Badge variant="outline" className="gap-1 border-orange-400 text-orange-600 dark:text-orange-400"><AlertTriangle className="size-3" />{days} ngày còn lại</Badge>;
  return <Badge className="gap-1 bg-green-600 hover:bg-green-600 text-white"><CheckCircle2 className="size-3" />Đã kích hoạt · {days} ngày</Badge>;
}

function TokenBar({ used, quota, label, suffix }: { used: number; quota: number; label?: string; suffix?: string }) {
  const pct = Math.min(100, Math.round((used / quota) * 100));
  const barColor = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-orange-500' : 'bg-gradient-to-r from-[#1485FF] to-[#78E4E2]';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          {label ? <Clock className="size-3" /> : <Coins className="size-3" />}
          {label ?? 'Token đã dùng'}
          {suffix && <span className="opacity-60 ml-1">{suffix}</span>}
        </span>
        <span className="tabular-nums">{f(used)} / {f(quota)} <span className="opacity-60">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KeyCard({ sub, onRefreshed, confirm }: { sub: KeySubscription; onRefreshed: (updated: KeySubscription) => void; confirm: (o: Parameters<ReturnType<typeof useConfirm>['confirm']>[0]) => Promise<boolean> }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const days = daysLeft(sub.expiresAt);
  const expired = isExpired(sub.expiresAt);
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

  async function handleRefresh() {
    if (!await confirm({ title: 'Đổi API key', description: 'Key cũ sẽ bị vô hiệu hóa ngay lập tức. Tiếp tục?', confirmLabel: 'Xác nhận đổi key' })) return;
    setRefreshing(true);
    try {
      const updated = await subscriptionApi.refreshKey(sub.id);
      onRefreshed(updated);
      toast.success('Đã đổi key mới thành công');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  const isActiveNotExpired = sub.isActive && !expired;
  return (
    <div className={`rounded-2xl border bg-card p-5 space-y-4 transition-shadow hover:shadow-md ${expired ? 'opacity-60' : ''} ${isActiveNotExpired ? 'dark:shadow-[0_0_20px_rgba(20,133,255,0.25)] dark:border-primary/40' : !expired && days > 7 ? 'border-green-500/40' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${expired ? 'bg-muted' : 'bg-primary/10'}`}>
            <Key className={`size-5 ${expired ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{sub.order?.plan?.name ?? 'Key subscription'}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="size-3" />
              Hết hạn {new Date(sub.expiresAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
        <StatusBadge days={days} isActive={sub.isActive} expired={expired} />
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

      {/* Quota 5h */}
      {sub.limitPeriod != null && (
        <TokenBar
          used={(sub.limitPeriod) - (sub.remainingPeriod ?? 0)}
          quota={sub.limitPeriod}
          label="Quota 5 tiếng"
          suffix={sub.resetAt ? `· Reset ${new Date(sub.resetAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : undefined}
        />
      )}

      {/* Hết hạn → gia hạn đúng key này (giữ key cũ); còn hạn → đổi key */}
      {expired ? (
        <a href={`/dashboard/buy?renew=${sub.id}`} className="w-full flex items-center justify-center gap-1.5 text-xs text-primary border border-dashed border-primary/40 rounded-lg py-2 transition-colors hover:bg-primary/5">
          <RefreshCw className="size-3" /> Gia hạn key này
        </a>
      ) : (
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive border border-dashed rounded-lg py-2 transition-colors hover:border-destructive/50 disabled:opacity-60"
        >
          {refreshing ? <><RefreshCw className="size-3 animate-spin" /> Đang đổi...</> : <><RefreshCw className="size-3" /> Đổi API key mới</>}
        </button>
      )}
    </div>
  );
}

function PendingOrderCard({ order, onCancelled, confirm }: { order: Order; onCancelled: (id: string) => void; confirm: (o: Parameters<ReturnType<typeof useConfirm>['confirm']>[0]) => Promise<boolean> }) {
  const [cancelling, setCancelling] = useState(false);

  async function cancel() {
    if (!await confirm({ title: 'Huỷ đơn hàng', description: 'Xác nhận huỷ đơn này? Ví/mã giảm giá (nếu có) sẽ được hoàn lại.', confirmLabel: 'Huỷ đơn', variant: 'destructive' })) return;
    setCancelling(true);
    try {
      await orderApi.cancel(order.id);
      onCancelled(order.id);
      toast.success('Đã huỷ đơn, hoàn lại ví/mã giảm giá (nếu có)');
    } catch (e) {
      toast.error((e as Error).message);
      setCancelling(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-orange-400/50 bg-orange-50/40 dark:bg-orange-950/10 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <Clock className="size-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{order.plan?.name ?? 'Đơn hàng'}{order.renewSubscriptionId ? ' (gia hạn)' : ''}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{f(Number(order.finalPrice))}₫ · tạo {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 border-orange-400 text-orange-600 dark:text-orange-400">
          <Clock className="size-3" />Chờ thanh toán
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Key chưa được kích hoạt. Sau khi thanh toán được xác nhận, key sẽ {order.renewSubscriptionId ? 'được gia hạn' : 'xuất hiện ở đây'} và sẵn sàng sử dụng. Đơn tự huỷ sau 24h nếu chưa thanh toán.
      </p>
      <div className="flex gap-2">
        <a href={`/dashboard/buy?order=${order.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-orange-600 text-white rounded-lg py-2 hover:bg-orange-700 transition-colors">
          Xem thông tin thanh toán
        </a>
        <button onClick={cancel} disabled={cancelling}
          className="text-xs border rounded-lg px-3 hover:bg-muted transition-colors disabled:opacity-60">
          {cancelling ? 'Đang huỷ...' : 'Huỷ đơn'}
        </button>
      </div>
    </div>
  );
}

export default function KeysPage() {
  const [subs, setSubs] = useState<KeySubscription[]>([]);
  const [pending, setPending] = useState<Order[]>([]);
  const { confirm, ConfirmDialog } = useConfirm();
  useEffect(() => {
    subscriptionApi.listMine().then(setSubs).catch(e => toast.error(e.message));
    orderApi.listMine().then(os => setPending(os.filter(o => o.status === 'pending'))).catch(() => {});
  }, []);

  const now = Date.now();
  const activeCount = subs.filter(s => s.isActive && new Date(s.expiresAt).getTime() > now).length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keys của tôi</h1>
          <p className="text-muted-foreground mt-1">
            {subs.length === 0 && pending.length === 0
              ? 'Bạn chưa có key nào'
              : `${activeCount} / ${subs.length} key đang hoạt động${pending.length ? ` · ${pending.length} đơn chờ thanh toán` : ''}`}
          </p>
        </div>
        <a href="/dashboard/buy" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <ShoppingCart className="size-4" /> Mua thêm
        </a>
      </div>

      {/* Empty state */}
      {subs.length === 0 && pending.length === 0 && (
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

      {/* Key + pending list */}
      {(subs.length > 0 || pending.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map(o => <PendingOrderCard key={o.id} order={o} onCancelled={id => setPending(prev => prev.filter(p => p.id !== id))} confirm={confirm} />)}
          {subs.map(sub => (
            <KeyCard
              key={sub.id}
              sub={sub}
              onRefreshed={updated => setSubs(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))}
              confirm={confirm}
            />
          ))}
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}

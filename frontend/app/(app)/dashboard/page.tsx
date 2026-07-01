'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { canAccessAdmin } from '@/lib/role-keys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { subscriptionApi, orderApi, adminUserApi, referralApi, walletApi } from '@/lib/api/admin.service';
import apiClient from '@/lib/api/client';
import {
  Key, ShoppingCart, BookOpen, Copy, Eye, EyeOff,
  ChevronRight, TrendingUp, Users, CreditCard, Zap,
  Activity, CheckCircle2, Clock, AlertTriangle,
  ShieldCheck, Bell, ScrollText, KeyRound, Wallet,
  Sparkles,
} from 'lucide-react';

const fmtN = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const fmtVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const daysLeft = (s: string) => Math.max(0, Math.ceil((new Date(s).getTime() - Date.now()) / 86400000));

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

/* ─── Key card ─── */
function KeyCard({ sub }: { sub: any }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const days = daysLeft(sub.expiresAt);
  const usedPct = sub.tokenUsedPct ?? 0;
  const remainingPct = sub.tokenRemainingPct ?? 100;

  const urgency = days <= 3 ? 'crit' : days <= 7 ? 'warn' : 'ok';
  const barColor = usedPct >= 90 ? 'bg-destructive' : usedPct >= 70 ? 'bg-orange-500' : 'bg-primary';

  function copy() {
    navigator.clipboard.writeText(sub.nineRouterKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden transition-all ${
      urgency === 'crit' ? 'border-destructive/50' : urgency === 'warn' ? 'border-orange-400/40' : 'border-border'
    }`}>
      {/* top bar — urgency indicator */}
      {urgency !== 'ok' && (
        <div className={`h-0.5 w-full ${urgency === 'crit' ? 'bg-destructive' : 'bg-orange-400'}`} />
      )}

      <div className="p-5 space-y-4">
        {/* header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
              sub.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <Key className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">{sub.order?.plan?.name ?? 'API Key'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Hết hạn {fmtDate(sub.expiresAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {days <= 7 && (
              <Badge variant={urgency === 'crit' ? 'destructive' : 'outline'}
                className={urgency === 'warn' ? 'text-orange-600 border-orange-300 dark:border-orange-700 dark:text-orange-400' : ''}>
                {days}d
              </Badge>
            )}
            <Badge variant={sub.isActive ? 'default' : 'secondary'} className="text-[10px]">
              {sub.isActive ? 'Active' : 'Off'}
            </Badge>
          </div>
        </div>

        {/* key string */}
        <div className="rounded-xl bg-muted/60 border border-border/60 px-3 py-2.5 flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-foreground/70 truncate">
            {show ? sub.nineRouterKey : (sub.nineRouterKeyMasked ?? sub.nineRouterKey?.slice(0, 14) + '•••')}
          </code>
          <button onClick={() => setShow(s => !s)}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground shrink-0">
            {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
          <button onClick={copy}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground shrink-0">
            {copied ? <CheckCircle2 className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
          </button>
        </div>

        {/* token usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Token đã dùng</span>
            <span className={`font-semibold tabular-nums ${usedPct >= 90 ? 'text-destructive' : usedPct >= 70 ? 'text-orange-500' : 'text-foreground'}`}>
              {usedPct}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${usedPct}%` }} />
          </div>
        </div>

        {/* stats row */}
        <div className="grid grid-cols-3 divide-x divide-border pt-1">
          {[
            { label: 'Đã dùng', value: `${usedPct}%` },
            { label: 'Còn lại', value: `${remainingPct}%` },
            { label: 'Còn', value: `${days} ngày` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center px-2 first:pl-0 last:pr-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold mt-0.5 tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = canAccessAdmin(user?.roleKey ?? null);

  const [subs, setSubs] = useState<any[] | null>(null);
  const [referral, setReferral] = useState<{ code: string; totalEarned: number } | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (!user) return;
    subscriptionApi.listMine().then(setSubs).catch(() => setSubs([]));
    referralApi.getMyCode().then(setReferral).catch(() => {});
    walletApi.getMe().then(r => setWalletBalance(r.balance)).catch(() => {});

    if (isAdmin) {
      Promise.all([
        adminUserApi.list({ limit: 1 }).catch(() => ({ total: 0 })),
        orderApi.listAdmin().catch(() => []),
        apiClient.get('/admin/subscriptions').catch(() => ({ data: [] })),
      ]).then(([usersRes, ordersRes, subsRes]) => {
        const orders = ordersRes as any[];
        const allSubs = ((subsRes as any).data ?? []) as any[];
        const paid = orders.filter(o => o.status === 'paid');
        setAdminStats({
          totalUsers: (usersRes as any).total ?? 0,
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'pending').length,
          paidOrders: paid.length,
          totalRevenue: paid.reduce((s, o) => s + Number(o.finalPrice), 0),
          activeSubs: allSubs.filter(s => s.isActive).length,
          totalTokenUsed: allSubs.reduce((s, x) => s + Number(x.tokenUsed), 0),
          totalTokenQuota: allSubs.reduce((s, x) => s + Number(x.tokenQuota), 0),
          recentOrders: orders.slice(0, 5),
        });
      });
    }
  }, [user, isAdmin]);

  if (!user) return null;

  const loading = subs === null;
  const activeSubs = subs?.filter(s => s.isActive) ?? [];
  const totalUsed = subs?.reduce((s, x) => s + Number(x.tokenUsed), 0) ?? 0;
  const totalQuota = subs?.reduce((s, x) => s + Number(x.tokenQuota), 0) ?? 0;

  return (
    <div className="space-y-8 pb-10">

      {/* ── Welcome header ── */}
      <div className="rounded-2xl border bg-card px-6 py-5 flex items-center justify-between gap-4
        dark:shadow-[0_0_30px_rgba(255,107,0,0.06)]">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Bảng điều khiển</p>
          <h1 className="text-xl font-bold">Xin chào, {user.name} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <Badge variant="outline" className="text-primary border-primary/30">Admin</Badge>}
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="size-5 text-primary" />
          </div>
        </div>
      </div>

      {/* ── Admin KPI ── */}
      {isAdmin && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tổng quan hệ thống</h2>

          {adminStats?.pendingOrders > 0 && (
            <Link href="/admin/orders"
              className="flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/50 px-4 py-3 hover:opacity-90 transition-opacity">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm text-amber-800 dark:text-amber-300 flex-1">
                <strong>{adminStats.pendingOrders} đơn hàng</strong> đang chờ xác nhận
              </span>
              <ChevronRight className="size-4 text-amber-500 shrink-0" />
            </Link>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {adminStats ? [
              { label: 'Người dùng', value: fmtN(adminStats.totalUsers), icon: Users, sub: 'Tổng tài khoản', iconCls: 'bg-primary/10 text-primary' },
              { label: 'Doanh thu', value: fmtVND(adminStats.totalRevenue), icon: TrendingUp, sub: `${adminStats.paidOrders} đơn`, iconCls: 'bg-emerald-500/10 text-emerald-500' },
              { label: 'Đơn hàng', value: fmtN(adminStats.totalOrders), icon: ShoppingCart, sub: `${adminStats.pendingOrders} chờ`, iconCls: adminStats.pendingOrders > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary' },
              { label: 'Key active', value: fmtN(adminStats.activeSubs), icon: Key, sub: 'Đang dùng', iconCls: 'bg-rose-500/10 text-rose-500' },
            ].map(({ label, value, icon: Icon, sub, iconCls }) => (
              <div key={label} className="rounded-xl border bg-card p-4 space-y-3">
                <div className={`size-9 rounded-lg flex items-center justify-center ${iconCls}`}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>
                </div>
              </div>
            )) : Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>

          {adminStats && adminStats.totalTokenQuota > 0 && (() => {
            const pct = Math.min(100, Math.round(adminStats.totalTokenUsed / adminStats.totalTokenQuota * 100));
            const barColor = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-orange-500' : 'bg-primary';
            return (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-primary" />
                    <span className="text-sm font-semibold">Token toàn hệ thống</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tabular-nums">{pct}%</span>
                    <Link href="/admin/subscriptions" className="text-xs text-primary hover:underline">Chi tiết</Link>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })()}

          <div className="grid gap-4 lg:grid-cols-5">
            {/* Recent orders */}
            <div className="lg:col-span-3 rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="size-4 text-primary" />
                  Đơn hàng gần đây
                </div>
                <Link href="/admin/orders" className="text-xs text-primary hover:underline">Xem tất cả</Link>
              </div>
              <div className="divide-y divide-border">
                {!adminStats && Array(4).fill(0).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <Skeleton className="size-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-20" /></div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                {adminStats?.recentOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">Chưa có đơn hàng</p>
                )}
                {adminStats?.recentOrders.map((o: any) => (
                  <div key={o.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      o.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500'
                      : o.status === 'pending' ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                      {o.status === 'paid' ? <CheckCircle2 className="size-4" />
                        : o.status === 'pending' ? <Clock className="size-4" />
                        : <AlertTriangle className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.user?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{o.plan?.name ?? '—'} · {fmtDate(o.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{fmtVND(Number(o.finalPrice))}</p>
                      <span className={`text-[10px] font-medium ${
                        o.status === 'paid' ? 'text-emerald-500' : o.status === 'pending' ? 'text-amber-500' : 'text-muted-foreground'
                      }`}>
                        {o.status === 'paid' ? 'Đã thu' : o.status === 'pending' ? 'Chờ' : 'Huỷ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick nav */}
            <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border text-sm font-semibold">
                <ScrollText className="size-4 text-primary" />Quản lý
              </div>
              <nav className="p-2 space-y-0.5">
                {[
                  { href: '/admin/orders', icon: CreditCard, label: 'Đơn hàng', badge: adminStats?.pendingOrders > 0 ? adminStats.pendingOrders : null },
                  { href: '/admin/subscriptions', icon: KeyRound, label: 'API Keys' },
                  { href: '/admin/users', icon: Users, label: 'Người dùng' },
                  { href: '/admin/plans', icon: Zap, label: 'Gói dịch vụ' },
                  { href: '/admin/coupons', icon: TrendingUp, label: 'Mã giảm giá' },
                  { href: '/admin/activity-logs', icon: Activity, label: 'Nhật ký' },
                  { href: '/admin/notifications', icon: Bell, label: 'Thông báo' },
                  { href: '/admin/roles', icon: ShieldCheck, label: 'Vai trò & quyền' },
                ].map(({ href, icon: Icon, label, badge = null }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors group">
                    <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge != null && <Badge className="text-[10px] px-1.5 py-0 h-4 shrink-0">{badge}</Badge>}
                    <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </section>
      )}

      {/* ── User: API Keys ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">API Keys của tôi</h2>
          {(subs?.length ?? 0) > 0 && (
            <Link href="/dashboard/my-keys" className="text-xs text-primary hover:underline flex items-center gap-1">
              Quản lý <ChevronRight className="size-3" />
            </Link>
          )}
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        )}

        {!loading && activeSubs.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border p-12 flex flex-col items-center gap-4 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <Key className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Chưa có API Key nào</p>
              <p className="text-sm text-muted-foreground mt-1">Mua gói để bắt đầu dùng Claude thông qua proxy</p>
            </div>
            <div className="flex gap-2">
              <Button render={<Link href="/dashboard/buy" />} nativeButton={false} size="sm">
                <ShoppingCart className="size-3.5 mr-1.5" />Mua key
              </Button>
              <Button variant="outline" render={<Link href="/dashboard/guide" />} nativeButton={false} size="sm">
                <BookOpen className="size-3.5 mr-1.5" />Hướng dẫn
              </Button>
            </div>
          </div>
        )}

        {!loading && activeSubs.length > 0 && (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Key đang dùng', value: String(activeSubs.length), accent: true },
                { label: 'Token đã dùng', value: fmtN(totalUsed), accent: false },
                { label: 'Token còn lại', value: fmtN(Math.max(0, totalQuota - totalUsed)), accent: false },
              ].map(({ label, value, accent }) => (
                <div key={label} className={`rounded-xl border px-4 py-3 text-center ${accent ? 'border-primary/30 bg-primary/5' : 'bg-card'}`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className={`text-xl font-bold mt-1 tabular-nums ${accent ? 'text-primary' : ''}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {activeSubs.map((sub: any) => <KeyCard key={sub.id} sub={sub} />)}
            </div>
          </>
        )}
      </section>

      {/* ── Quick access ── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tiện ích</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/dashboard/buy', icon: ShoppingCart, label: 'Mua key', desc: 'Chọn gói, thanh toán VietQR', accent: false },
            { href: '/dashboard/guide', icon: BookOpen, label: 'Hướng dẫn', desc: 'Cấu hình Claude Code', accent: false },
            { href: '/dashboard/profile', icon: ShieldCheck, label: 'Bảo mật', desc: 'Đổi mật khẩu, bật 2FA', accent: false },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}
              className="group flex items-center gap-3.5 rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
              <div className="size-10 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                <Icon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Wallet ── */}
      {walletBalance > 0 && (
        <Link href="/dashboard/buy"
          className="flex items-center justify-between rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Số dư ví</p>
              <p className="text-xs text-muted-foreground mt-0.5">Dùng khi mua key tiếp theo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-primary tabular-nums">{fmtVND(walletBalance)}</p>
            <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
          </div>
        </Link>
      )}

      {/* ── Referral ── */}
      {referral && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-4 text-primary" />
                <p className="text-sm font-semibold">Mã giới thiệu</p>
              </div>
              <p className="text-xs text-muted-foreground">Chia sẻ để nhận hoa hồng <strong>10%</strong> mỗi đơn thành công</p>
              <div className="mt-3 flex items-center gap-2">
                <code className="text-lg font-mono font-bold tracking-widest bg-muted px-3 py-1.5 rounded-lg">
                  {referral.code}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(referral.code); setCopiedRef(true); setTimeout(() => setCopiedRef(false), 2000); }}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  {copiedRef ? <CheckCircle2 className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                  {copiedRef ? 'Đã copy!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Hoa hồng</p>
              <p className="text-2xl font-bold text-emerald-500 tabular-nums mt-1">+{fmtVND(referral.totalEarned)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

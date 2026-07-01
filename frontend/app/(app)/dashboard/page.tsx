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
} from 'lucide-react';

const fmtN = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const fmtVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const daysLeft = (s: string) => Math.max(0, Math.ceil((new Date(s).getTime() - Date.now()) / 86400000));

/* ─── Skeleton ─── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

/* ─── Token progress bar ─── */
function TokenBar({ pct, showLabel = true }: { pct: number; showLabel?: boolean }) {
  const color = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-orange-500' : 'bg-primary';
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Đã dùng {pct}%</span>
          <span className={pct >= 90 ? 'text-destructive font-semibold' : ''}>{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── Key card ─── */
function KeyCard({ sub }: { sub: any }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const days = daysLeft(sub.expiresAt);
  const usedPct = sub.tokenUsedPct ?? 0;
  const remainingPct = sub.tokenRemainingPct ?? 100;

  function copy() {
    navigator.clipboard.writeText(sub.nineRouterKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header stripe */}
      <div className={`h-1 w-full ${days <= 3 ? 'bg-destructive' : days <= 7 ? 'bg-orange-500' : 'bg-primary'}`} />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{sub.order?.plan?.name ?? 'API Key'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hết hạn {fmtDate(sub.expiresAt)} · còn {days} ngày
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {days <= 7 && <Badge variant={days <= 3 ? 'destructive' : 'outline'} className={days > 3 ? 'text-orange-600 border-orange-300' : ''}>{days}d</Badge>}
            <Badge variant={sub.isActive ? 'default' : 'secondary'}>{sub.isActive ? 'Active' : 'Off'}</Badge>
          </div>
        </div>

        {/* API Key row */}
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
          <code className="flex-1 text-xs font-mono text-muted-foreground truncate">
            {show ? sub.nineRouterKey : (sub.nineRouterKeyMasked ?? sub.nineRouterKey?.slice(0, 14) + '•••')}
          </code>
          <button onClick={() => setShow(s => !s)} className="p-1 rounded hover:bg-background transition-colors text-muted-foreground hover:text-foreground shrink-0">
            {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
          <button onClick={copy} className="p-1 rounded hover:bg-background transition-colors text-muted-foreground hover:text-foreground shrink-0">
            {copied ? <CheckCircle2 className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
          </button>
        </div>

        {/* Token usage */}
        <TokenBar pct={usedPct} />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: 'Đã dùng', value: `${usedPct}%` },
            { label: 'Còn lại', value: `${remainingPct}%` },
            { label: 'Trạng thái', value: usedPct >= 100 ? 'Hết' : usedPct >= 90 ? 'Gần hết' : 'Còn' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold mt-0.5 tabular-nums">{value}</p>
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
    // Always load user subs (even admin may have bought a key)
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

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Xin chào, {user.name}</h1>
        </div>
        {isAdmin && <Badge variant="outline" className="shrink-0 hidden sm:flex">Admin</Badge>}
      </div>

      {/* ── Admin KPI ── */}
      {isAdmin && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tổng quan hệ thống</h2>

          {adminStats?.pendingOrders > 0 && (
            <Link href="/admin/orders"
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 hover:opacity-90 transition-opacity">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm text-amber-800 dark:text-amber-300 flex-1">
                <strong>{adminStats.pendingOrders} đơn hàng</strong> đang chờ xác nhận
              </span>
              <ChevronRight className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            </Link>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {adminStats ? [
              { label: 'Người dùng', value: fmtN(adminStats.totalUsers), icon: Users, sub: 'Tổng tài khoản', c: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50' },
              { label: 'Doanh thu', value: fmtVND(adminStats.totalRevenue), icon: TrendingUp, sub: `${adminStats.paidOrders} đơn thành công`, c: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50' },
              { label: 'Đơn hàng', value: fmtN(adminStats.totalOrders), icon: ShoppingCart, sub: `${adminStats.pendingOrders} chờ xác nhận`, c: adminStats.pendingOrders > 0 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50' : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50' },
              { label: 'Key active', value: fmtN(adminStats.activeSubs), icon: Key, sub: 'Subscription đang dùng', c: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50' },
            ].map(({ label, value, icon: Icon, sub, c }) => (
              <div key={label} className="rounded-2xl border bg-card p-4 flex items-start gap-3">
                <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${c}`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
                  <p className="text-lg font-bold mt-0.5 truncate">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
              </div>
            )) : Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>

          {/* System token bar */}
          {adminStats && adminStats.totalTokenQuota > 0 && (
            <div className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  <span className="text-sm font-semibold">Token toàn hệ thống</span>
                </div>
                <Link href="/admin/subscriptions" className="text-xs text-primary hover:underline">Chi tiết</Link>
              </div>
              <TokenBar pct={adminStats.totalTokenQuota > 0 ? Math.min(100, Math.round(adminStats.totalTokenUsed / adminStats.totalTokenQuota * 100)) : 0} />
            </div>
          )}

          {/* 2-col: recent orders + quick links */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Recent orders */}
            <div className="lg:col-span-3 rounded-2xl border bg-card">
              <div className="flex items-center justify-between px-5 py-3.5 border-b">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="size-4 text-muted-foreground" />Đơn hàng gần đây
                </div>
                <Link href="/admin/orders" className="text-xs text-primary hover:underline">Xem tất cả</Link>
              </div>
              <div className="divide-y">
                {!adminStats && Array(4).fill(0).map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-24" /></div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                {adminStats?.recentOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">Chưa có đơn hàng</p>
                )}
                {adminStats?.recentOrders.map((o: any) => (
                  <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${o.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : o.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                      {o.status === 'paid' ? <CheckCircle2 className="size-4" /> : o.status === 'pending' ? <Clock className="size-4" /> : <AlertTriangle className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.user?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{o.plan?.name ?? '—'} · {fmtDate(o.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{fmtVND(Number(o.finalPrice))}</p>
                      <Badge variant={o.status === 'paid' ? 'default' : o.status === 'pending' ? 'outline' : 'secondary'} className="text-[10px] px-1.5 py-0 mt-0.5">
                        {o.status === 'paid' ? 'Đã thu' : o.status === 'pending' ? 'Chờ' : 'Huỷ'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick nav */}
            <div className="lg:col-span-2 rounded-2xl border bg-card">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b text-sm font-semibold">
                <ScrollText className="size-4 text-muted-foreground" />Quản lý
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
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors">
                    <Icon className="size-4 text-muted-foreground shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge != null && <Badge className="text-[10px] px-1.5 py-0 shrink-0">{badge}</Badge>}
                    <ChevronRight className="size-3.5 text-muted-foreground/40 shrink-0" />
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </section>
      )}

      {/* ── User: key overview ── */}
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
            {[0, 1].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        )}

        {!loading && activeSubs.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-4 text-center">
            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
              <Key className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Chưa có API Key</p>
              <p className="text-sm text-muted-foreground mt-1">Mua gói để dùng Claude thông qua AI Key</p>
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
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Key đang dùng', value: activeSubs.length },
                { label: 'Token đã dùng', value: fmtN(totalUsed) },
                { label: 'Token còn lại', value: fmtN(Math.max(0, totalQuota - totalUsed)) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border bg-card px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold mt-1 tabular-nums">{value}</p>
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
            { href: '/dashboard/buy', icon: ShoppingCart, label: 'Mua key', desc: 'Chọn gói, thanh toán VietQR' },
            { href: '/dashboard/guide', icon: BookOpen, label: 'Hướng dẫn tích hợp', desc: 'Cấu hình Claude Code settings.json' },
            { href: '/dashboard/profile', icon: ShieldCheck, label: 'Bảo mật', desc: 'Đổi mật khẩu, bật 2FA' },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}
              className="group flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-all">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Referral ── */}
      {/* Ví */}
      {walletBalance > 0 && (
        <Link href="/dashboard/buy" className="rounded-2xl border bg-card p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Wallet className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Số dư ví</p>
              <p className="text-xs text-muted-foreground">Dùng để mua key</p>
            </div>
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{fmtVND(walletBalance)}</p>
        </Link>
      )}

      {referral && (
        <section className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Mã giới thiệu</p>
            <p className="text-xs text-muted-foreground mt-0.5">Chia sẻ để nhận hoa hồng 10% mỗi đơn thành công</p>
            <code className="text-base font-mono font-bold tracking-widest mt-2 block">{referral.code}</code>
          </div>
          <div className="text-right shrink-0 space-y-2">
            <p className="text-xs text-muted-foreground">Hoa hồng nhận được</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{fmtVND(referral.totalEarned)}</p>
            <button
              onClick={() => { navigator.clipboard.writeText(referral.code); setCopiedRef(true); setTimeout(() => setCopiedRef(false), 2000); }}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline ml-auto">
              {copiedRef ? <CheckCircle2 className="size-3 text-green-500" /> : <Copy className="size-3" />}
              {copiedRef ? 'Đã copy!' : 'Copy mã'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

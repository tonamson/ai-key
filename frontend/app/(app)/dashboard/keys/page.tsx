'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { subscriptionApi, referralApi, KeySubscription } from '@/lib/api/admin.service';

export default function KeysPage() {
  const [subs, setSubs] = useState<KeySubscription[]>([]);
  const [referral, setReferral] = useState<{ code: string; totalEarned: number } | null>(null);

  useEffect(() => {
    subscriptionApi.listMine().then(setSubs).catch(e => toast.error(e.message));
    referralApi.getMyCode().then(setReferral).catch(() => {});
  }, []);

  const f = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  function daysLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Keys của tôi</h1>
        <p className="text-sm text-muted-foreground">{subs.length} subscription đang hoạt động</p>
      </div>

      {subs.length === 0 && (
        <div className="rounded-lg border bg-background p-12 text-center text-muted-foreground">
          Bạn chưa có key nào. <a href="/dashboard/buy" className="text-primary underline">Mua ngay</a>
        </div>
      )}

      <div className="space-y-4">
        {subs.map(sub => {
          const usedPct = Math.min(100, Math.round((Number(sub.tokenUsed) / Number(sub.tokenQuota)) * 100));
          const days = daysLeft(sub.expiresAt);
          return (
            <div key={sub.id} className="rounded-lg border bg-background p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{sub.order?.plan?.name ?? 'Key subscription'}</p>
                  <p className="text-xs text-muted-foreground">Hết hạn: {new Date(sub.expiresAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {days <= 3 && <Badge variant="destructive">{days} ngày còn lại</Badge>}
                  {days > 3 && days <= 7 && <Badge variant="outline" className="text-orange-600">{days} ngày còn lại</Badge>}
                  {days > 7 && <Badge variant="secondary">{days} ngày còn lại</Badge>}
                  <Badge variant={sub.isActive ? 'default' : 'secondary'}>{sub.isActive ? 'Hoạt động' : 'Tạm dừng'}</Badge>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted rounded px-3 py-2 font-mono truncate">{sub.nineRouterKey}</code>
                  <Button variant="outline" size="sm" className="shrink-0"
                    onClick={() => {
                      const fullKey = sub.nineRouterKey.replace(/\*+$/, '');
                      navigator.clipboard.writeText(sub.nineRouterKey).then(() => toast.success('Đã copy key'));
                    }}>
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Token đã dùng</span>
                  <span>{f(Number(sub.tokenUsed))} / {f(Number(sub.tokenQuota))} ({usedPct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${usedPct >= 90 ? 'bg-destructive' : usedPct >= 70 ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${usedPct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {referral && (
        <div className="rounded-lg border bg-background p-5 space-y-3">
          <h2 className="font-semibold">Mã giới thiệu của bạn</h2>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-muted rounded px-3 py-2 font-mono tracking-widest">{referral.code}</code>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(referral.code).then(() => toast.success('Đã copy'))}>
              <Copy className="size-3.5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Tổng hoa hồng nhận được: <strong>{f(referral.totalEarned)}đ</strong></p>
        </div>
      )}
    </div>
  );
}

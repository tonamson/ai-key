'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { orderApi, Order } from '@/lib/api/admin.service';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Chờ thanh toán', variant: 'outline' },
  paid: { label: 'Đã thanh toán', variant: 'default' },
  cancelled: { label: 'Đã huỷ', variant: 'destructive' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = () => orderApi.listAdmin().then(setOrders).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  async function handleConfirm(o: Order) {
    if (!confirm(`Xác nhận thanh toán đơn #${o.id.slice(0, 8)}?`)) return;
    setConfirming(o.id);
    try {
      await orderApi.confirm(o.id);
      toast.success('Xác nhận thành công');
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setConfirming(null); }
  }

  const f = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  const vietQRUrl = (o: Order) => `https://img.vietqr.io/image/TECHCOMBANK-19032009391010-compact.png?amount=${o.finalPrice}&addInfo=AIKEY-${o.id}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Đơn hàng</h1>
        <p className="text-sm text-muted-foreground">{orders.length} đơn</p>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Gói</TableHead>
              <TableHead>Gốc</TableHead>
              <TableHead>Giảm</TableHead>
              <TableHead>Thực thu</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(o => {
              const st = STATUS_LABELS[o.status] ?? STATUS_LABELS.pending;
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.user?.name ?? o.userId.slice(0, 8)}</TableCell>
                  <TableCell>{o.plan?.name ?? o.planId.slice(0, 8)}</TableCell>
                  <TableCell>{f(o.originalPrice)}đ</TableCell>
                  <TableCell className="text-muted-foreground">{o.discountAmount > 0 ? `-${f(o.discountAmount)}đ` : '—'}</TableCell>
                  <TableCell className="font-semibold">{f(o.finalPrice)}đ</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {o.status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(vietQRUrl(o)).then(() => toast.success('Đã copy QR URL'))}><Copy className="size-3.5 mr-1" />QR</Button>
                          <Button size="sm" disabled={confirming === o.id} onClick={() => handleConfirm(o)}><CheckCircle className="size-3.5 mr-1" />Xác nhận</Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {orders.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Chưa có đơn hàng nào</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

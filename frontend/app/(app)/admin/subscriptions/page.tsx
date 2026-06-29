'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Pencil, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import apiClient from '@/lib/api/client';

interface AdminSub {
  id: string;
  user?: { name: string; email: string };
  order?: { plan?: { name: string } };
  nineRouterKey: string;
  nineRouterKeyId: string;
  tokenQuota: number;
  tokenUsed: number;
  tokenUsedPeriod: number;
  periodStartsAt: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

const fmtN = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN');
const daysLeft = (s: string) => Math.max(0, Math.ceil((new Date(s).getTime() - Date.now()) / 86400000));

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<AdminSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminSub | null>(null);
  const [form, setForm] = useState({ tokenQuota: '', tokenUsed: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminSub | null>(null);
  const [resetting, setResetting] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient.get<AdminSub[]>('/admin/subscriptions')
      .then(r => setSubs(r.data))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function openEdit(s: AdminSub) {
    setForm({
      tokenQuota: String(s.tokenQuota),
      tokenUsed: String(s.tokenUsed),
      expiresAt: new Date(s.expiresAt).toISOString().slice(0, 10),
    });
    setEditing(s);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.patch(`/admin/subscriptions/${editing.id}`, {
        tokenQuota: Number(form.tokenQuota),
        tokenUsed: Number(form.tokenUsed),
        expiresAt: new Date(form.expiresAt).toISOString(),
      });
      toast.success('Đã cập nhật');
      setEditing(null);
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleResetPeriod() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      await apiClient.post(`/admin/subscriptions/${resetTarget.id}/reset-period`);
      toast.success('Đã reset countdown quota');
      setResetTarget(null);
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setResetting(false); }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Đã copy');
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Quản lý API Keys</h1>
        <p className="text-sm text-muted-foreground">{subs.length} subscriptions</p>
      </div>

      <div className="rounded-lg border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Gói</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Token dùng / Quota</TableHead>
              <TableHead>Quota/giờ (period)</TableHead>
              <TableHead>Hiệu lực</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Đang tải...</TableCell></TableRow>
            )}
            {!loading && subs.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Chưa có subscription nào</TableCell></TableRow>
            )}
            {subs.map(s => {
              const days = daysLeft(s.expiresAt);
              const expired = new Date(s.expiresAt) < new Date();
              const pct = Math.min(100, Math.round(Number(s.tokenUsed) / Number(s.tokenQuota) * 100));
              const periodPct = Math.min(100, Math.round(Number(s.tokenUsedPeriod) / (Number(s.tokenQuota) / 720) * 100));
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{s.user?.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{s.user?.email ?? '—'}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.order?.plan?.name ?? <span className="italic text-muted-foreground">Tạo tay</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded max-w-[160px] truncate block">
                        {s.nineRouterKey}
                      </code>
                      <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => copy(s.nineRouterKey)}>
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm tabular-nums">{fmtN(Number(s.tokenUsed))} / {fmtN(Number(s.tokenQuota))}</div>
                    <div className="h-1.5 w-28 rounded-full bg-muted overflow-hidden mt-1">
                      <div className={`h-full rounded-full ${pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-orange-500' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{pct}%</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm tabular-nums">{fmtN(Number(s.tokenUsedPeriod))} / {fmtN(Math.floor(Number(s.tokenQuota) / 720))}</div>
                    <div className="h-1.5 w-28 rounded-full bg-muted overflow-hidden mt-1">
                      <div className={`h-full rounded-full ${periodPct >= 90 ? 'bg-destructive' : 'bg-cyan-500'}`}
                        style={{ width: `${periodPct}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Reset lúc {new Date(new Date(s.periodStartsAt).getTime() + 3600000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="text-muted-foreground">{fmtDate(s.startsAt)} →</div>
                    <div className={expired ? 'text-destructive font-medium' : 'font-medium'}>{fmtDate(s.expiresAt)}</div>
                    {!expired && <div className="text-primary">{days} ngày còn lại</div>}
                    {expired && <div className="text-destructive">Đã hết hạn</div>}
                  </TableCell>
                  <TableCell>
                    {expired
                      ? <Badge variant="destructive">Hết hạn</Badge>
                      : s.isActive
                        ? <Badge variant="default">Active</Badge>
                        : <Badge variant="secondary">Off</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="size-8" title="Chỉnh sửa" onClick={() => openEdit(s)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-cyan-600 hover:text-cyan-600" title="Reset countdown quota" onClick={() => setResetTarget(s)}>
                        <RefreshCw className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Chỉnh sửa subscription</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Token Quota (tổng)</Label>
              <Input type="number" required value={form.tokenQuota}
                onChange={e => setForm(f => ({ ...f, tokenQuota: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Giới hạn token tổng cộng của subscription này</p>
            </div>
            <div className="space-y-1.5">
              <Label>Token đã dùng</Label>
              <Input type="number" required value={form.tokenUsed}
                onChange={e => setForm(f => ({ ...f, tokenUsed: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Đặt về 0 để reset toàn bộ token đã dùng</p>
            </div>
            <div className="space-y-1.5">
              <Label>Ngày hết hạn</Label>
              <Input type="date" required value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset period confirm dialog */}
      <Dialog open={!!resetTarget} onOpenChange={o => !o && setResetTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Xác nhận reset countdown</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Bạn sắp reset countdown quota giờ của key:
            </p>
            <code className="block text-xs font-mono bg-muted px-3 py-2 rounded">
              {resetTarget?.nineRouterKey}
            </code>
            <p className="text-sm text-muted-foreground">
              Token dùng trong giờ hiện tại (<strong>{fmtN(Number(resetTarget?.tokenUsedPeriod ?? 0))}</strong> tokens) sẽ bị xoá và đồng hồ đếm lại từ đầu.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetTarget(null)}>Huỷ</Button>
            <Button variant="destructive" disabled={resetting} onClick={handleResetPeriod}>
              {resetting ? 'Đang reset...' : 'Xác nhận reset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

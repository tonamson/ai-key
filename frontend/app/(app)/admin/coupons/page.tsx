'use client';

import { useEffect, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { couponApi, Coupon } from '@/lib/api/admin.service';

const EMPTY = { code: '', discountType: 'percent' as 'percent' | 'fixed', discountValue: 10, maxUses: '', expiresAt: '', isActive: true };

export default function CouponsPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = () => couponApi.list().then(setCoupons).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setEditing(null); setDialog(true); }
  function openEdit(c: Coupon) {
    setForm({ code: c.code, discountType: c.discountType, discountValue: c.discountValue, maxUses: c.maxUses?.toString() ?? '', expiresAt: c.expiresAt?.slice(0, 10) ?? '', isActive: c.isActive });
    setEditing(c); setDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { ...form, maxUses: form.maxUses ? +form.maxUses : undefined, expiresAt: form.expiresAt || undefined };
      if (editing) { await couponApi.update(editing.id, payload); toast.success('Cập nhật thành công'); }
      else { await couponApi.create(payload); toast.success('Tạo thành công'); }
      setDialog(false); load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleRemove(c: Coupon) {
    if (!await confirm({ title: 'Ẩn mã giảm giá', description: `Ẩn mã "${c.code}"? Mã này sẽ không thể sử dụng được nữa.`, confirmLabel: 'Ẩn mã', variant: 'default' })) return;
    try { await couponApi.remove(c.id); toast.success('Đã ẩn'); load(); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Mã giảm giá</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} mã</p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4 mr-1" />Thêm mã</Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Đã dùng</TableHead>
              <TableHead>Hết hạn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map(c => (
              <TableRow key={c.id}>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.code}</code></TableCell>
                <TableCell><Badge variant="outline">{c.discountType === 'percent' ? 'Phần trăm' : 'Cố định'}</Badge></TableCell>
                <TableCell>{c.discountType === 'percent' ? `${c.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(c.discountValue)}đ`}</TableCell>
                <TableCell>{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : '—'}</TableCell>
                <TableCell><Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'Hiện' : 'Ẩn'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(c)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleRemove(c)}><Trash2 className="size-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Chưa có mã nào</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog} onOpenChange={o => !o && setDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa mã' : 'Thêm mã giảm giá'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1"><Label>Mã code</Label><Input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} /></div>
            <div className="space-y-1">
              <Label>Loại giảm giá</Label>
              <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Cố định (VND)</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Giá trị</Label><Input required type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: +e.target.value }))} /></div>
            <div className="space-y-1"><Label>Giới hạn lượt (tuỳ chọn)</Label><Input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Không giới hạn" /></div>
            <div className="space-y-1"><Label>Hết hạn (tuỳ chọn)</Label><Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <Label htmlFor="isActive">Kích hoạt</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Huỷ</Button>
              <Button type="submit" disabled={loading}>Lưu</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {ConfirmDialog}
    </div>
  );
}

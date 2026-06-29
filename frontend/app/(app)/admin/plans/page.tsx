'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { planApi, Plan } from '@/lib/api/admin.service';

const EMPTY = { name: '', tokenQuota: 21000000, durationDays: 30, price: 350000, isActive: true };

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = () => planApi.list().then(setPlans).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setEditing(null); setDialog(true); }
  function openEdit(p: Plan) {
    setForm({ name: p.name, tokenQuota: p.tokenQuota, durationDays: p.durationDays, price: p.price, isActive: p.isActive });
    setEditing(p); setDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) { await planApi.update(editing.id, form); toast.success('Cập nhật thành công'); }
      else { await planApi.create(form); toast.success('Tạo thành công'); }
      setDialog(false); load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleRemove(p: Plan) {
    if (!confirm(`Ẩn gói "${p.name}"?`)) return;
    try { await planApi.remove(p.id); toast.success('Đã ẩn'); load(); }
    catch (e) { toast.error((e as Error).message); }
  }

  const f = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Gói dịch vụ</h1>
          <p className="text-sm text-muted-foreground">{plans.length} gói</p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4 mr-1" />Thêm gói</Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên gói</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Thời hạn</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{f(p.tokenQuota)} token</TableCell>
                <TableCell>{p.durationDays} ngày</TableCell>
                <TableCell>{f(p.price)}đ</TableCell>
                <TableCell><Badge variant={p.isActive ? 'default' : 'secondary'}>{p.isActive ? 'Hiện' : 'Ẩn'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(p)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleRemove(p)}><Trash2 className="size-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {plans.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Chưa có gói nào</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog} onOpenChange={o => !o && setDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa gói' : 'Thêm gói mới'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1"><Label>Tên gói</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Số token</Label><Input required type="number" value={form.tokenQuota} onChange={e => setForm(f => ({ ...f, tokenQuota: +e.target.value }))} /></div>
            <div className="space-y-1"><Label>Số ngày</Label><Input required type="number" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: +e.target.value }))} /></div>
            <div className="space-y-1"><Label>Giá (VND)</Label><Input required type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <Label htmlFor="isActive">Hiển thị</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Huỷ</Button>
              <Button type="submit" disabled={loading}>Lưu</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

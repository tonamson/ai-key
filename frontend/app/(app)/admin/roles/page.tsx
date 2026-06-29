'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { roleApi, Role } from '@/lib/api/admin.service';

const EMPTY = { name: '', description: '', group: '' };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = () => roleApi.list().then(setRoles).catch(e => toast.error(e.message));

  useEffect(() => { load(); }, []);

  function openEdit(r: Role) {
    setForm({ name: r.name, description: r.description ?? '', group: r.group ?? '' });
    setEditing(r);
    setDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    try {
      await roleApi.update(editing.id, { ...form, group: form.group || undefined });
      toast.success('Cập nhật thành công');
      setDialog(false);
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleDelete(r: Role) {
    if (!confirm(`Xoá vai trò "${r.name}"?`)) return;
    try { await roleApi.remove(r.id); toast.success('Đã xoá'); load(); }
    catch (e) { toast.error((e as Error).message); }
  }

  const grouped = Array.from(new Set(roles.map(r => r.group).filter(Boolean))).map(g => ({
    group: g!,
    roles: roles.filter(r => r.group === g),
  }));
  const ungrouped = roles.filter(r => !r.group);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Vai trò & Phân quyền</h1>
        <p className="text-sm text-muted-foreground">{roles.length} vai trò</p>
      </div>

      <div className="space-y-4">
        {grouped.map(({ group, roles: grpRoles }) => (
          <div key={group} className="rounded-lg border bg-background">
            <div className="border-b px-4 py-2.5 font-medium text-sm bg-muted/50">{group}</div>
            <Table>
              <TableBody>
                {grpRoles.map(r => <RoleRow key={r.id} role={r} onEdit={openEdit} onDelete={handleDelete} />)}
              </TableBody>
            </Table>
          </div>
        ))}
        {ungrouped.length > 0 && (
          <div className="rounded-lg border bg-background">
            <div className="border-b px-4 py-2.5 font-medium text-sm bg-muted/50 text-muted-foreground">Chưa phân nhóm</div>
            <Table>
              <TableBody>
                {ungrouped.map(r => <RoleRow key={r.id} role={r} onEdit={openEdit} onDelete={handleDelete} />)}
              </TableBody>
            </Table>
          </div>
        )}
        {roles.length === 0 && <div className="text-center text-muted-foreground py-12">Chưa có vai trò nào</div>}
      </div>

      <Dialog open={dialog} onOpenChange={o => !o && setDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa vai trò</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Role key</Label>
              <Input value={editing?.key ?? ''} disabled className="bg-muted/50 font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Key được định nghĩa cố định từ hệ thống</p>
            </div>
            <div className="space-y-1">
              <Label>Tên hiển thị</Label>
              <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Nhóm</Label>
              <Input placeholder="VD: Kinh Doanh, Ban Giám Đốc..." value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Mô tả</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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

function RoleRow({ role, onEdit, onDelete }: { role: Role; onEdit: (r: Role) => void; onDelete: (r: Role) => void }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{role.name}</TableCell>
      <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{role.key}</code></TableCell>
      <TableCell className="text-sm text-muted-foreground">{role.description ?? '—'}</TableCell>
      <TableCell><Badge variant={role.isActive ? 'default' : 'destructive'}>{role.isActive ? 'Hoạt động' : 'Tạm dừng'}</Badge></TableCell>
      <TableCell>
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(role)}><Pencil className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => onDelete(role)}><Trash2 className="size-4" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

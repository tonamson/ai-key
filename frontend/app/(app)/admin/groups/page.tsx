'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { roleApi, Role } from '@/lib/api/admin.service';

interface Group { name: string; roles: Role[]; }

function buildGroups(roles: Role[]): Group[] {
  const map = new Map<string, Role[]>();
  for (const r of roles) {
    if (!r.group) continue;
    if (!map.has(r.group)) map.set(r.group, []);
    map.get(r.group)!.push(r);
  }
  return Array.from(map.entries()).map(([name, roles]) => ({ name, roles }));
}

export default function GroupsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // dialog state
  const [nameDialog, setNameDialog] = useState<{ mode: 'create' | 'edit'; group?: Group } | null>(null);
  const [assignDialog, setAssignDialog] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');

  // pending checkbox state khi đang trong assign dialog
  const [pendingGroup, setPendingGroup] = useState<string>('');
  const [pendingChecked, setPendingChecked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try { setRoles(await roleApi.list()); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = buildGroups(roles);

  // ── Name dialog ──────────────────────────────────────────────────────────────
  function openCreate() {
    setGroupName('');
    setNameDialog({ mode: 'create' });
  }

  function openRename(g: Group) {
    setGroupName(g.name);
    setNameDialog({ mode: 'edit', group: g });
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = groupName.trim();
    if (!name) return;

    if (nameDialog?.mode === 'create') {
      if (groups.some(g => g.name === name)) { toast.error('Tên nhóm đã tồn tại'); return; }
      // Mở assign dialog với nhóm mới (chưa có role nào)
      setNameDialog(null);
      openAssign({ name, roles: [] });
      return;
    }

    // rename
    const old = nameDialog?.group;
    if (!old) return;
    if (old.name === name) { setNameDialog(null); return; }
    if (groups.some(g => g.name === name)) { toast.error('Tên nhóm đã tồn tại'); return; }
    setSaving(true);
    try {
      await Promise.all(old.roles.map(r => roleApi.update(r.id, { group: name })));
      toast.success('Đổi tên nhóm thành công');
      setNameDialog(null);
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  // ── Assign dialog ─────────────────────────────────────────────────────────────
  function openAssign(g: Group) {
    setPendingGroup(g.name);
    // checked = roles hiện tại đang thuộc nhóm này
    setPendingChecked(new Set(roles.filter(r => r.group === g.name).map(r => r.id)));
    setAssignDialog(g);
  }

  function togglePending(roleId: string) {
    setPendingChecked(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId); else next.add(roleId);
      return next;
    });
  }

  async function handleAssignSave() {
    if (!assignDialog) return;
    setSaving(true);
    try {
      const before = new Set(roles.filter(r => r.group === pendingGroup).map(r => r.id));
      const toAdd = roles.filter(r => pendingChecked.has(r.id) && !before.has(r.id));
      const toRemove = roles.filter(r => before.has(r.id) && !pendingChecked.has(r.id));
      await Promise.all([
        ...toAdd.map(r => roleApi.update(r.id, { group: pendingGroup })),
        ...toRemove.map(r => roleApi.update(r.id, { group: undefined })),
      ]);
      toast.success('Cập nhật nhóm thành công');
      setAssignDialog(null);
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function handleDelete(g: Group) {
    if (!confirm(`Xoá nhóm "${g.name}"?\nCác vai trò trong nhóm sẽ không còn thuộc nhóm nào.`)) return;
    setSaving(true);
    try {
      await Promise.all(g.roles.map(r => roleApi.update(r.id, { group: undefined })));
      toast.success(`Đã xoá nhóm "${g.name}"`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Quản lý nhóm</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Đang tải...' : `${groups.length} nhóm`}
          </p>
        </div>
        <Button size="sm" onClick={openCreate} disabled={loading}>
          <Plus className="mr-1.5 size-4" />Tạo nhóm
        </Button>
      </div>

      {/* Group list */}
      {!loading && groups.length === 0 && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Users className="mx-auto size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Chưa có nhóm nào</p>
          <p className="text-xs text-muted-foreground mt-1">Tạo nhóm để liên kết với các vai trò trong hệ thống</p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="mr-1.5 size-4" />Tạo nhóm đầu tiên
          </Button>
        </div>
      )}

      {groups.length > 0 && (
        <div className="grid gap-3">
          {groups.map(g => (
            <div key={g.name} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <div className="font-semibold">{g.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.roles.length === 0
                    ? <span className="text-xs text-muted-foreground italic">Chưa có vai trò</span>
                    : g.roles.map(r => (
                        <Badge key={r.id} variant={r.isActive ? 'secondary' : 'outline'} className={!r.isActive ? 'opacity-50' : ''}>
                          {r.name}
                        </Badge>
                      ))
                  }
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1.5" onClick={() => openAssign(g)}>
                  <Users className="size-3.5" />Gán vai trò
                </Button>
                <Button size="icon" variant="ghost" className="size-8" onClick={() => openRename(g)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(g)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Name dialog (create / rename) */}
      <Dialog open={!!nameDialog} onOpenChange={o => !o && setNameDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{nameDialog?.mode === 'create' ? 'Tạo nhóm mới' : 'Đổi tên nhóm'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên nhóm</Label>
              <Input
                autoFocus required
                placeholder="VD: Kinh doanh, Kỹ thuật..."
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNameDialog(null)}>Huỷ</Button>
              <Button type="submit" disabled={saving}>
                {nameDialog?.mode === 'create' ? 'Tiếp theo' : 'Lưu'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign roles dialog */}
      <Dialog open={!!assignDialog} onOpenChange={o => !o && setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gán vai trò — {assignDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {roles.length === 0
              ? <p className="text-sm text-muted-foreground py-4 text-center">Chưa có vai trò nào trong hệ thống.</p>
              : roles.map(r => {
                  const checked = pendingChecked.has(r.id);
                  const otherGroup = r.group && r.group !== pendingGroup ? r.group : null;
                  return (
                    <label
                      key={r.id}
                      className="flex items-center gap-3 cursor-pointer rounded-md px-3 py-2.5 hover:bg-muted transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={checked}
                        onChange={() => togglePending(r.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{r.name}</div>
                        {r.description && <div className="text-xs text-muted-foreground truncate">{r.description}</div>}
                      </div>
                      {otherGroup && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {otherGroup}
                        </Badge>
                      )}
                    </label>
                  );
                })
            }
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-muted-foreground">{pendingChecked.size} vai trò được chọn</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAssignDialog(null)}>Huỷ</Button>
              <Button onClick={handleAssignSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

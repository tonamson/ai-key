'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, Search, MoreHorizontal, Lock, Unlock, Shield, MailCheck, MailX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { adminUserApi, roleApi, AdminUser, Role } from '@/lib/api/admin.service';
import { useConfirm } from '@/hooks/use-confirm';

// ── helpers ───────────────────────────────────────────────────────────────────
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

function initials(name: string) {
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-primary', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500',
  'bg-pink-500', 'bg-amber-500', 'bg-teal-500', 'bg-red-500',
];

function avatarColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab({ roles }: { roles: Role[] }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminUserApi.list({ search: search || undefined })
      .then(r => setUsers(r.items))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleActive(u: AdminUser) {
    try {
      if (u.isActive) await adminUserApi.deactivate(u.id);
      else await adminUserApi.activate(u.id);
      toast.success(u.isActive ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản');
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function toggleVerify(u: AdminUser) {
    try {
      if (u.emailVerified) await adminUserApi.unverifyEmail(u.id);
      else await adminUserApi.verifyEmail(u.id);
      toast.success(u.emailVerified ? 'Đã bỏ duyệt xác thực' : 'Đã duyệt xác thực email');
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function changeRole(u: AdminUser, roleId: string) {
    try {
      await adminUserApi.update(u.id, { roleId });
      toast.success('Đã cập nhật vai trò');
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  const active = users.filter(u => u.isActive).length;
  const locked = users.length - active;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span><span className="font-semibold text-foreground">{users.length}</span> tài khoản</span>
          <span className="h-4 w-px bg-border" />
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />{active} hoạt động
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" />{locked} bị khoá
          </span>
        </div>
        <div className="relative flex items-center gap-2">
          <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm theo email hoặc tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            className="pl-8 w-64 h-8 text-sm"
          />
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-8">Tìm</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Người dùng</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id} className="group">
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${avatarColor(u.email)}`}>
                      {initials(u.name || u.email)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium leading-tight truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <select
                    className="text-sm border rounded-md px-2 py-1 bg-background h-7 focus:outline-none focus:ring-1 focus:ring-ring"
                    value={u.roleId ?? ''}
                    onChange={e => changeRole(u, e.target.value)}
                  >
                    <option value="">— không có —</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </TableCell>
                <TableCell>
                  <Badge variant={u.twoFactorEnabled ? 'default' : 'secondary'} className="text-xs">
                    {u.twoFactorEnabled ? 'Bật' : 'Tắt'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`size-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-destructive'}`} />
                      <span className="text-sm">{u.isActive ? 'Hoạt động' : 'Bị khoá'}</span>
                    </div>
                    <Badge variant={u.emailVerified ? 'default' : 'secondary'} className="text-xs w-fit">
                      {u.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="size-7 inline-flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => toggleActive(u)}>
                        {u.isActive
                          ? <><Lock className="mr-2 size-3.5" />Khoá tài khoản</>
                          : <><Unlock className="mr-2 size-3.5" />Mở khoá</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleVerify(u)}>
                        {u.emailVerified
                          ? <><MailX className="mr-2 size-3.5" />Bỏ duyệt xác thực</>
                          : <><MailCheck className="mr-2 size-3.5" />Duyệt xác thực</>
                        }
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                  <Users className="mx-auto size-8 mb-3 opacity-30" />
                  Không có người dùng nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Roles & Groups tab ────────────────────────────────────────────────────────
const ROLE_EMPTY = { name: '', description: '', group: '' };

function RoleRow({ role, onEdit, onDelete }: { role: Role; onEdit: (r: Role) => void; onDelete: (r: Role) => void }) {
  return (
    <TableRow className="group">
      <TableCell className="pl-4">
        <div className="flex items-center gap-3">
          <div className={`size-7 rounded-md flex items-center justify-center shrink-0 ${avatarColor(role.key)} text-white`}>
            <Shield className="size-3.5" />
          </div>
          <div>
            <div className="font-medium text-sm">{role.name}</div>
            {role.description && <div className="text-xs text-muted-foreground">{role.description}</div>}
          </div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{role.key}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${role.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
          <span className="text-sm">{role.isActive ? 'Hoạt động' : 'Tắt'}</span>
        </div>
      </TableCell>
      <TableCell className="text-right pr-4">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="size-7" onClick={() => onEdit(role)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(role)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function RolesTab({ roles, onRolesChange }: { roles: Role[]; onRolesChange: () => void }) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [roleDialog, setRoleDialog] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState(ROLE_EMPTY);
  const [saving, setSaving] = useState(false);

  // group dialogs
  const [nameDialog, setNameDialog] = useState<{ mode: 'create' | 'edit'; group?: Group } | null>(null);
  const [assignDialog, setAssignDialog] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [pendingGroup, setPendingGroup] = useState('');
  const [pendingChecked, setPendingChecked] = useState<Set<string>>(new Set());

  const groups = buildGroups(roles);
  const ungrouped = roles.filter(r => !r.group);

  // ── role actions ────────────────────────────────────
  function openEdit(r: Role) {
    setForm({ name: r.name, description: r.description ?? '', group: r.group ?? '' });
    setEditing(r);
    setRoleDialog(true);
  }

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await roleApi.update(editing.id, { ...form, group: form.group || undefined });
      toast.success('Cập nhật thành công');
      setRoleDialog(false);
      onRolesChange();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleRoleDelete(r: Role) {
    if (!await confirm({ title: 'Xoá vai trò', description: `Xoá vai trò "${r.name}"?\nHành động này không thể hoàn tác.`, confirmLabel: 'Xoá' })) return;
    try { await roleApi.remove(r.id); toast.success('Đã xoá'); onRolesChange(); }
    catch (e) { toast.error((e as Error).message); }
  }

  // ── group actions ───────────────────────────────────
  function openCreateGroup() { setGroupName(''); setNameDialog({ mode: 'create' }); }
  function openRenameGroup(g: Group) { setGroupName(g.name); setNameDialog({ mode: 'edit', group: g }); }

  async function handleGroupNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = groupName.trim();
    if (!name) return;
    if (nameDialog?.mode === 'create') {
      if (groups.some(g => g.name === name)) { toast.error('Tên nhóm đã tồn tại'); return; }
      setNameDialog(null);
      openAssign({ name, roles: [] });
      return;
    }
    const old = nameDialog?.group;
    if (!old || old.name === name) { setNameDialog(null); return; }
    if (groups.some(g => g.name === name)) { toast.error('Tên nhóm đã tồn tại'); return; }
    setSaving(true);
    try {
      await Promise.all(old.roles.map(r => roleApi.update(r.id, { group: name })));
      toast.success('Đổi tên nhóm thành công');
      setNameDialog(null);
      onRolesChange();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  function openAssign(g: Group) {
    setPendingGroup(g.name);
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
      onRolesChange();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleGroupDelete(g: Group) {
    if (!await confirm({ title: 'Xoá nhóm', description: `Xoá nhóm "${g.name}"?\nCác vai trò trong nhóm sẽ không còn thuộc nhóm nào.`, confirmLabel: 'Xoá nhóm' })) return;
    setSaving(true);
    try {
      await Promise.all(g.roles.map(r => roleApi.update(r.id, { group: undefined })));
      toast.success(`Đã xoá nhóm "${g.name}"`);
      onRolesChange();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{roles.length}</span> vai trò
          {groups.length > 0 && <> · <span className="font-semibold text-foreground">{groups.length}</span> nhóm</>}
        </p>
        <Button size="sm" variant="outline" onClick={openCreateGroup} className="h-8">
          <Plus className="mr-1.5 size-3.5" />Tạo nhóm
        </Button>
      </div>

      {roles.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          <Shield className="mx-auto size-8 mb-3 opacity-30" />
          Chưa có vai trò nào
        </div>
      ) : (
        <div className="space-y-3">
          {/* Grouped roles */}
          {groups.map(g => (
            <div key={g.name} className="rounded-lg border bg-background overflow-hidden">
              <div className="border-b px-4 py-2 flex items-center justify-between bg-muted/40">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.name}</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1" onClick={() => openAssign(g)}>
                    <Users className="size-3" />Gán vai trò
                  </Button>
                  <Button size="icon" variant="ghost" className="size-6" onClick={() => openRenameGroup(g)}>
                    <Pencil className="size-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleGroupDelete(g)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
              <Table>
                <TableBody>
                  {g.roles.map(r => <RoleRow key={r.id} role={r} onEdit={openEdit} onDelete={handleRoleDelete} />)}
                </TableBody>
              </Table>
            </div>
          ))}

          {/* Ungrouped roles */}
          {ungrouped.length > 0 && (
            <div className="rounded-lg border bg-background overflow-hidden">
              <div className="border-b px-4 py-2 bg-muted/40">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chưa phân nhóm</span>
              </div>
              <Table>
                <TableBody>
                  {ungrouped.map(r => <RoleRow key={r.id} role={r} onEdit={openEdit} onDelete={handleRoleDelete} />)}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Edit role dialog */}
      <Dialog open={roleDialog} onOpenChange={o => !o && setRoleDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Chỉnh sửa vai trò</DialogTitle></DialogHeader>
          <form onSubmit={handleRoleSubmit} className="space-y-3">
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
              <Button type="button" variant="outline" onClick={() => setRoleDialog(false)}>Huỷ</Button>
              <Button type="submit" disabled={saving}>Lưu</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create / rename group dialog */}
      <Dialog open={!!nameDialog} onOpenChange={o => !o && setNameDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{nameDialog?.mode === 'create' ? 'Tạo nhóm mới' : 'Đổi tên nhóm'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGroupNameSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên nhóm</Label>
              <Input autoFocus required placeholder="VD: Kinh doanh, Kỹ thuật..." value={groupName} onChange={e => setGroupName(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNameDialog(null)}>Huỷ</Button>
              <Button type="submit" disabled={saving}>{nameDialog?.mode === 'create' ? 'Tiếp theo' : 'Lưu'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {ConfirmDialog}

      {/* Assign roles to group dialog */}
      <Dialog open={!!assignDialog} onOpenChange={o => !o && setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Gán vai trò — {assignDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {roles.map(r => {
              const checked = pendingChecked.has(r.id);
              const otherGroup = r.group && r.group !== pendingGroup ? r.group : null;
              return (
                <label key={r.id} className="flex items-center gap-3 cursor-pointer rounded-md px-3 py-2.5 hover:bg-muted transition-colors">
                  <input type="checkbox" className="size-4 accent-primary" checked={checked} onChange={() => togglePending(r.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{r.name}</div>
                    {r.description && <div className="text-xs text-muted-foreground truncate">{r.description}</div>}
                  </div>
                  {otherGroup && <Badge variant="outline" className="text-xs shrink-0">{otherGroup}</Badge>}
                </label>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-muted-foreground">{pendingChecked.size} vai trò được chọn</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAssignDialog(null)}>Huỷ</Button>
              <Button size="sm" onClick={handleAssignSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Root page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [roles, setRoles] = useState<Role[]>([]);

  const loadRoles = useCallback(() => {
    roleApi.list().then(setRoles).catch(e => toast.error(e.message));
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Người dùng & Phân quyền</h1>
        <p className="text-sm text-muted-foreground">Quản lý tài khoản, nhóm và vai trò trong hệ thống</p>
      </div>

      <Tabs defaultValue="users" orientation="vertical" className="flex gap-6 items-start">
        <TabsList className="flex flex-col w-44 shrink-0 h-auto p-1">
          <TabsTrigger value="users" className="w-full justify-start gap-2">
            <Users className="size-3.5" />Người dùng
          </TabsTrigger>
          <TabsTrigger value="roles" className="w-full justify-start gap-2">
            <Shield className="size-3.5" />Vai trò & Nhóm
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 min-w-0">
          <TabsContent value="users">
            <UsersTab roles={roles} />
          </TabsContent>
          <TabsContent value="roles">
            <RolesTab roles={roles} onRolesChange={loadRoles} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

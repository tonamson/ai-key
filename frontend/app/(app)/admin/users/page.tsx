'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminUserApi, roleApi, AdminUser, Role } from '@/lib/api/admin.service';

const EMPTY_FORM = { email: '', password: '', name: '', roleId: '' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminUserApi.list({
        search: search || undefined,
        roleId: filterRole || undefined,
        isActive: filterActive || undefined,
        page, limit,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterActive, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { roleApi.list().then(setRoles).catch(() => {}); }, []);

  function openCreate() { setForm(EMPTY_FORM); setEditing(null); setDialog('create'); }
  function openEdit(u: AdminUser) {
    setForm({ email: u.email, password: '', name: u.name, roleId: u.roleId ?? '' });
    setEditing(u); setDialog('edit');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (dialog === 'create') {
        await adminUserApi.create(form);
        toast.success('Tạo nhân viên thành công');
      } else if (editing) {
        const { password, email, ...rest } = form;
        await adminUserApi.update(editing.id, rest);
        toast.success('Cập nhật thành công');
      }
      setDialog(null); load();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function toggleActive(u: AdminUser) {
    try {
      if (u.isActive) await adminUserApi.deactivate(u.id);
      else await adminUserApi.activate(u.id);
      toast.success(u.isActive ? 'Đã khóa tài khoản' : 'Đã kích hoạt tài khoản');
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Quản lý nhân viên</h1>
          <p className="text-sm text-muted-foreground">{total} nhân viên</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1 size-4" /> Thêm nhân viên</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Tìm tên, email, SĐT..." className="pl-8" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={filterRole || 'all'} onValueChange={v => { setFilterRole(v === 'all' ? '' : (v ?? '')); setPage(1); }}>
          <SelectTrigger className="w-44">
            <span className="truncate text-sm">
              {filterRole ? (roles.find(r => r.id === filterRole)?.name ?? filterRole) : 'Tất cả vai trò'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterActive || 'all'} onValueChange={v => { setFilterActive(v === 'all' ? '' : (v ?? '')); setPage(1); }}>
          <SelectTrigger className="w-36">
            <span className="truncate text-sm">
              {filterActive === 'true' ? 'Đang hoạt động' : filterActive === 'false' ? 'Đã khóa' : 'Trạng thái'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="true">Đang hoạt động</SelectItem>
            <SelectItem value="false">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Nhóm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Đang tải...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không có dữ liệu</TableCell></TableRow>
            ) : users.map(u => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                  {u.roleDetail ? (
                    <Badge variant="secondary">{u.roleDetail.name}</Badge>
                  ) : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell className="text-sm">{u.roleDetail?.group ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'default' : 'destructive'}>
                    {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>} />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(u)}><Pencil className="mr-2 size-4" />Chỉnh sửa</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(u)} className={u.isActive ? 'text-destructive' : ''}>
                        {u.isActive ? <><UserX className="mr-2 size-4" />Khóa tài khoản</> : <><UserCheck className="mr-2 size-4" />Kích hoạt</>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">Trang {page}/{totalPages}</span>
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
        </div>
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={!!dialog} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? 'Thêm nhân viên' : 'Chỉnh sửa nhân viên'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {dialog === 'create' && (
              <>
                <div className="space-y-1"><Label>Email</Label>
                  <Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1"><Label>Mật khẩu</Label>
                  <Input type="password" required minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </>
            )}
            <div className="space-y-1"><Label>Họ tên</Label>
              <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1"><Label>Vai trò</Label>
              <Select value={form.roleId || 'none'} onValueChange={v => setForm(f => ({ ...f, roleId: v === 'none' ? '' : (v ?? '') }))}>
                <SelectTrigger>
                  <span className="truncate text-sm">
                    {form.roleId
                      ? (() => { const r = roles.find(x => x.id === form.roleId); return r ? `${r.name}${r.group ? ` (${r.group})` : ''}` : form.roleId; })()
                      : 'Không có'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} {r.group ? <span className="text-muted-foreground">({r.group})</span> : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Huỷ</Button>
              <Button type="submit">{dialog === 'create' ? 'Tạo' : 'Lưu'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

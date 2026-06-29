'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminUserApi, roleApi, AdminUser, Role } from '@/lib/api/admin.service';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      adminUserApi.list({ search: search || undefined }),
      roleApi.list(),
    ])
      .then(([u, r]) => { setUsers(u.items); setRoles(r); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleActive(u: AdminUser) {
    try {
      if (u.isActive) await adminUserApi.deactivate(u.id);
      else await adminUserApi.activate(u.id);
      toast.success(u.isActive ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản');
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Người dùng</h1>
        <p className="text-sm text-muted-foreground">{users.length} tài khoản</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Tìm theo email hoặc tên..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={load} disabled={loading}>Tìm</Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <select
                    className="text-sm border rounded px-1 py-0.5 bg-background"
                    value={u.roleId ?? ''}
                    onChange={e => changeRole(u, e.target.value)}
                  >
                    <option value="">— không có —</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </TableCell>
                <TableCell>
                  <Badge variant={u.twoFactorEnabled ? 'default' : 'secondary'}>
                    {u.twoFactorEnabled ? 'Bật' : 'Tắt'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'default' : 'destructive'}>
                    {u.isActive ? 'Hoạt động' : 'Bị khoá'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(u)}
                  >
                    {u.isActive ? 'Khoá' : 'Mở khoá'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
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

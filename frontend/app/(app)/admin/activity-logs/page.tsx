'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { activityLogApi, adminUserApi, ActivityLog, AdminUser } from '@/lib/api/admin.service';

const ACTION_LABELS: Record<string, string> = {
  login: 'Đăng nhập', logout: 'Đăng xuất',
  create: 'Tạo mới', update: 'Cập nhật', delete: 'Xoá', view: 'Xem',
};
const ACTION_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  login: 'default', logout: 'secondary',
  create: 'default', update: 'secondary', delete: 'destructive', view: 'secondary',
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const limit = 20;

  useEffect(() => {
    adminUserApi.list({ limit: 200 }).then(r => setUsers(r.items)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await activityLogApi.list({
        userId: filterUserId || undefined,
        action: filterAction || undefined,
        module: filterModule || undefined,
        from: from || undefined,
        to: to || undefined,
        page, limit,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch (e) { toast.error((e as Error).message); }
  }, [filterUserId, filterAction, filterModule, from, to, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  const resetFilters = () => { setFilterUserId(''); setFilterAction(''); setFilterModule(''); setFrom(''); setTo(''); setPage(1); };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Nhật ký hoạt động</h1>
        <p className="text-sm text-muted-foreground">{total} bản ghi</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={filterUserId} onValueChange={(v) => { setFilterUserId(v === 'all' ? '' : (v ?? '')); setPage(1); }}>
          <SelectTrigger className="w-48">
            <span className="truncate text-sm">
              {filterUserId ? (users.find(u => u.id === filterUserId)?.name ?? filterUserId) : 'Nhân viên'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhân viên</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={(v) => { setFilterAction(v === 'all' ? '' : (v ?? '')); setPage(1); }}>
          <SelectTrigger className="w-40">
            <span className="truncate text-sm">
              {filterAction ? (ACTION_LABELS[filterAction] ?? filterAction) : 'Hành động'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input className="w-36" placeholder="Module..." value={filterModule}
          onChange={e => { setFilterModule(e.target.value); setPage(1); }} />
        <Input type="date" className="w-40" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} />
        <Input type="date" className="w-40" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} />
        <Button variant="outline" size="sm" onClick={resetFilters}>Xoá lọc</Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Không có dữ liệu</TableCell></TableRow>
            ) : logs.map(log => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </TableCell>
                <TableCell>
                  {log.user ? (
                    <div>
                      <div className="text-sm font-medium">{log.user.name}</div>
                      <div className="text-xs text-muted-foreground">{log.user.email}</div>
                    </div>
                  ) : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={ACTION_VARIANTS[log.action] ?? 'secondary'}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{log.module}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.ipAddress ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">Trang {page}/{totalPages}</span>
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}

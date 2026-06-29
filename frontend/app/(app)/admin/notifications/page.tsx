'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminUser, Notification, NotificationType, adminUserApi, notificationApi } from '@/lib/api/admin.service';

const TYPE_LABELS: Record<NotificationType, string> = {
  system: 'Hệ thống', deal: 'Deal', reminder: 'Nhắc việc', matching: 'Matching',
};
const TYPE_VARIANTS: Record<NotificationType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  system: 'secondary', deal: 'default', reminder: 'outline', matching: 'default',
};

export default function AdminNotificationsPage() {
  const [items, setItems]       = useState<Notification[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterRead, setFilterRead]     = useState('');
  const [showCreate, setShowCreate]     = useState(false);
  const [creating, setCreating]         = useState(false);
  const [form, setForm] = useState({ userId: '', type: 'system' as NotificationType, title: '', body: '', link: '' });
  const limit = 20;

  useEffect(() => {
    adminUserApi.list({ limit: 200 }).then(r => setUsers(r.items)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const isRead = filterRead === 'true' ? true : filterRead === 'false' ? false : undefined;
      const res = await notificationApi.adminList({
        userId: filterUserId || undefined,
        type: filterType as NotificationType || undefined,
        isRead,
        page,
        limit,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) { toast.error((e as Error).message); }
  }, [filterUserId, filterType, filterRead, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);
  const reset = () => { setFilterUserId(''); setFilterType(''); setFilterRead(''); setPage(1); };

  const submitCreate = async () => {
    if (!form.title.trim()) return toast.error('Tiêu đề không được để trống');
    setCreating(true);
    try {
      await notificationApi.adminCreate({
        userId: form.userId || undefined,
        type: form.type,
        title: form.title.trim(),
        body: form.body.trim() || undefined,
        link: form.link.trim() || undefined,
      });
      toast.success('Đã tạo thông báo');
      setShowCreate(false);
      setForm({ userId: '', type: 'system', title: '', body: '', link: '' });
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Thông báo</h1>
          <p className="text-sm text-muted-foreground">{total} bản ghi</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" />Tạo thông báo
        </Button>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tạo thông báo</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Người nhận</Label>
              <Select value={form.userId || 'all'} onValueChange={v => setForm(f => ({ ...f, userId: v === 'all' ? '' : (v ?? '') }))}>
                <SelectTrigger>
                  <span className="text-sm">{form.userId ? (users.find(u => u.id === form.userId)?.name ?? form.userId) : 'Tất cả (broadcast)'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhân viên (broadcast)</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Loại</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: (v ?? 'system') as NotificationType }))}>
                <SelectTrigger><span className="text-sm">{TYPE_LABELS[form.type]}</span></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tiêu đề <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nội dung tiêu đề..." />
            </div>
            <div className="space-y-1">
              <Label>Nội dung chi tiết</Label>
              <Input value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Mô tả thêm (tuỳ chọn)..." />
            </div>
            <div className="space-y-1">
              <Label>Link điều hướng</Label>
              <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/deals/123 (tuỳ chọn)" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Huỷ</Button>
              <Button onClick={submitCreate} disabled={creating}>{creating ? 'Đang gửi...' : 'Tạo thông báo'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap gap-2">
        <Select value={filterUserId || 'all'} onValueChange={v => { setFilterUserId(v === 'all' ? '' : (v ?? '')); setPage(1); }}>
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

        <Select value={filterType || 'all'} onValueChange={v => { setFilterType(v === 'all' ? '' : (v ?? '')); setPage(1); }}>
          <SelectTrigger className="w-36">
            <span className="truncate text-sm">
              {filterType ? (TYPE_LABELS[filterType as NotificationType] ?? filterType) : 'Loại'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterRead || 'all'} onValueChange={v => { setFilterRead(v === 'all' ? '' : (v ?? '')); setPage(1); }}>
          <SelectTrigger className="w-32">
            <span className="truncate text-sm">
              {filterRead === 'true' ? 'Đã đọc' : filterRead === 'false' ? 'Chưa đọc' : 'Trạng thái'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="false">Chưa đọc</SelectItem>
            <SelectItem value="true">Đã đọc</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={reset}>Xoá lọc</Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Người nhận</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Không có dữ liệu</TableCell>
              </TableRow>
            ) : items.map(n => (
              <TableRow key={n.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleString('vi-VN')}
                </TableCell>
                <TableCell>
                  {n.user ? (
                    <div>
                      <div className="text-sm font-medium">{n.user.name}</div>
                      <div className="text-xs text-muted-foreground">{n.user.email}</div>
                    </div>
                  ) : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={TYPE_VARIANTS[n.type] ?? 'secondary'}>
                    {TYPE_LABELS[n.type] ?? n.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground line-clamp-1">{n.body}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={n.isRead ? 'outline' : 'default'}>
                    {n.isRead ? 'Đã đọc' : 'Chưa đọc'}
                  </Badge>
                </TableCell>
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

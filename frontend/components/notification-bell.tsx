'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Notification, notificationApi } from '@/lib/api/admin.service';

export function NotificationBell() {
  const [count, setCount]         = useState(0);
  const [items, setItems]         = useState<Notification[]>([]);
  const [open, setOpen]           = useState(false);
  const intervalRef               = useRef<ReturnType<typeof setInterval>>(null);

  const fetchCount = useCallback(async () => {
    try { setCount((await notificationApi.unreadCount()).count); } catch {}
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const res = await notificationApi.list({ limit: 10 });
      setItems(res.items);
    } catch (e) { toast.error((e as Error).message); }
  }, []);

  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchCount]);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) fetchItems();
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setCount(0);
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) { toast.error((e as Error).message); }
  };

  const markOne = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setCount(c => Math.max(0, c - 1));
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Thông báo</span>
          {count > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAll}>
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Không có thông báo</p>
        ) : (
          items.map(n => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer ${!n.isRead ? 'bg-muted/50' : ''}`}
              onClick={() => { if (!n.isRead) markOne(n.id); if (n.link) window.location.href = n.link; }}
            >
              <div className="flex w-full items-center gap-2">
                {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                <span className={`text-sm ${!n.isRead ? 'font-medium' : 'text-muted-foreground'}`}>{n.title}</span>
              </div>
              {n.body && <span className="text-xs text-muted-foreground pl-4 line-clamp-2">{n.body}</span>}
              <span className="text-[10px] text-muted-foreground pl-4">
                {new Date(n.createdAt).toLocaleString('vi-VN')}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

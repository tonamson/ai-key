'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/app-sidebar';
import { useAuthStore } from '@/lib/store/auth.store';
import { useHydration } from '@/lib/hooks/use-hydration';
import { canAccessAdmin } from '@/lib/role-keys';
import { NotificationBell } from '@/components/notification-bell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydration();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) { router.replace('/login'); return; }
    if (pathname.startsWith('/admin') && !canAccessAdmin(user?.roleKey ?? null)) {
      router.replace('/dashboard');
    }
  }, [hydrated, token, user, pathname, router]);

  if (!hydrated || !token) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="ml-auto" />
          <NotificationBell />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

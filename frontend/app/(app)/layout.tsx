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
import { ThemeToggle } from '@/components/theme-toggle';

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
      <SidebarInset className="app-bg">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-sm px-5">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col p-6 md:p-8">
          {children}
        </div>
      </SidebarInset>

    </SidebarProvider>
  );
}

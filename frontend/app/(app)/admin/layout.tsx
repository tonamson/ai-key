'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { useHydration } from '@/lib/hooks/use-hydration';
import { canAccessAdmin } from '@/lib/role-keys';

export default function AdminGuardLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydration();
  const { token, user } = useAuthStore();

  if (!hydrated || !token || !canAccessAdmin(user?.roleKey ?? null)) return null;

  return <>{children}</>;
}

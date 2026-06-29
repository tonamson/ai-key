import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';

export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Chạy client-side only
    const alreadyHydrated = useAuthStore.persist.hasHydrated();
    if (alreadyHydrated) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  return hydrated;
}

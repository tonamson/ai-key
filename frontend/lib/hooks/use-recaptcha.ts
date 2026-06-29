'use client';

import { useCallback } from 'react';

declare global {
  interface Window { grecaptcha: any; }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

export function useRecaptcha() {
  const execute = useCallback(async (action: string): Promise<string> => {
    if (!SITE_KEY || SITE_KEY.startsWith('your_')) return 'dev-bypass';
    if (!window.grecaptcha) return 'grecaptcha-not-loaded';
    try {
      return await new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(SITE_KEY, { action }).then(resolve).catch(reject);
        });
      });
    } catch {
      // Test key hoặc localhost không được phép — backend bypass khi NODE_ENV !== production
      return 'dev-bypass';
    }
  }, []);

  return { execute };
}

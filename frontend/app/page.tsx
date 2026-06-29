'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      sessionStorage.setItem('ref_code', ref.toUpperCase());
      router.replace(`/register?ref=${ref}`);
    } else {
      router.replace('/login');
    }
  }, []);

  return null;
}

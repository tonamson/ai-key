'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Redirect() {
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

export default function Home() {
  return <Suspense><Redirect /></Suspense>;
}

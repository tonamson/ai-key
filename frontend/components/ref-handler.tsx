'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RefHandler() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) sessionStorage.setItem('ref_code', ref.toUpperCase());
  }, [searchParams]);
  return null;
}

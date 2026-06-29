'use client';

import { useEffect, useState } from 'react';

export function QRCodeCanvas({ value, size = 200 }: { value: string; size?: number }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!value) return;
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(value, { width: size, margin: 2 }).then(setSrc);
    });
  }, [value, size]);

  if (!src) return <div style={{ width: size, height: size }} className="rounded-lg border bg-muted animate-pulse" />;
  return <img src={src} alt="QR Code" width={size} height={size} className="rounded-lg border" />;
}

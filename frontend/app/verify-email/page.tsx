"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authService } from "@/lib/api/auth.service";
import { useAuthStore } from "@/lib/store/auth.store";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); return; }
    authService.verifyEmail(token)
      .then(async (data) => {
        const { setAuthToken } = await import('@/lib/api/client');
        setAuthToken(data.accessToken);
        useAuthStore.setState({ token: data.accessToken, user: data.user });
        setStatus('success');
        setTimeout(() => router.replace('/dashboard'), 2000);
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">
            {status === 'loading' ? 'Đang xác thực...' : status === 'success' ? 'Xác thực thành công!' : 'Link không hợp lệ'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Vui lòng chờ...'}
            {status === 'success' && 'Tài khoản đã được kích hoạt. Đang chuyển hướng...'}
            {status === 'error' && 'Link xác thực không hợp lệ hoặc đã được sử dụng.'}
          </CardDescription>
        </CardHeader>
        {status === 'error' && (
          <CardContent>
            <Link href="/login" className="text-primary underline underline-offset-4 text-sm">Quay lại đăng nhập</Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailContent /></Suspense>;
}

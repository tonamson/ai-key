"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/api/auth.service";
import { useAuthStore } from "@/lib/store/auth.store";
import { Key, CheckCircle2, Zap, Shield, ArrowLeft, Loader2 } from "lucide-react";

function AuthLeft() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12
      bg-gradient-to-br from-[#080B0F] to-[#0D1F3C]
      dark:from-[#080B0F] dark:to-[#0D1F3C]">
      <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm">
        <ArrowLeft className="size-4" /> cheapaikey.store
      </Link>
      <div className="space-y-8">
        <div className="size-14 rounded-2xl bg-primary/15 flex items-center justify-center dark:shadow-[0_0_30px_rgba(255,107,0,0.35)]">
          <Key className="size-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">Xác thực email</h1>
          <p className="text-white/60 text-lg leading-relaxed">Xác thực email để kích hoạt tài khoản và bắt đầu sử dụng.</p>
        </div>
        <ul className="space-y-3">
          {[
            { icon: Zap, text: 'Kích hoạt ngay sau khi xác thực' },
            { icon: Shield, text: 'Tài khoản được bảo vệ' },
            { icon: CheckCircle2, text: 'Nhận key trong vài giây' },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-white/70">
              <Icon className="size-4 text-[#78E4E2] shrink-0" />
              <span className="text-sm">{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-white/30 text-xs">© 2025 cheapaikey.store</p>
    </div>
  );
}

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
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthLeft />
      <div className="flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className={`size-14 rounded-2xl flex items-center justify-center mx-auto ${
            status === 'loading' ? 'bg-muted' :
            status === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
            'bg-destructive/10'
          }`}>
            {status === 'loading' && <Loader2 className="size-7 text-muted-foreground animate-spin" />}
            {status === 'success' && <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />}
            {status === 'error' && <Key className="size-7 text-destructive" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {status === 'loading' ? 'Đang xác thực...' : status === 'success' ? 'Xác thực thành công!' : 'Link không hợp lệ'}
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              {status === 'loading' && 'Vui lòng chờ...'}
              {status === 'success' && 'Tài khoản đã được kích hoạt. Đang chuyển hướng...'}
              {status === 'error' && 'Link xác thực không hợp lệ hoặc đã được sử dụng.'}
            </p>
          </div>
          {status === 'error' && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <Link href="/login" className="text-primary underline underline-offset-4 text-sm">Quay lại đăng nhập</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailContent /></Suspense>;
}

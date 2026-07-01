"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/api/auth.service";
import { Key, CheckCircle2, Zap, Shield, ArrowLeft } from "lucide-react";

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
          <h1 className="text-3xl font-bold text-white mb-3">Mật khẩu mới</h1>
          <p className="text-white/60 text-lg leading-relaxed">Đặt mật khẩu mới an toàn cho tài khoản của bạn.</p>
        </div>
        <ul className="space-y-3">
          {[
            { icon: Zap, text: 'Đăng nhập ngay sau khi đặt lại' },
            { icon: Shield, text: 'Mật khẩu được mã hóa an toàn' },
            { icon: CheckCircle2, text: 'Tối thiểu 8 ký tự' },
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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Link không hợp lệ hoặc đã hết hạn.</p>
        <Link href="/forgot-password" className="block w-full text-center rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium hover:bg-muted/80 transition-colors text-foreground">
          Yêu cầu link mới
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token!, password);
      toast.success("Đặt lại mật khẩu thành công");
      router.replace("/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Link không hợp lệ hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu mới</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
        <Input
          id="confirm"
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthLeft />
      <div className="flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/" className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-2">
            <ArrowLeft className="size-4" /> Trang chủ
          </Link>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold">Đặt lại mật khẩu</h2>
            <p className="text-muted-foreground text-sm">Nhập mật khẩu mới cho tài khoản của bạn</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 dark:shadow-[0_0_20px_rgba(255,107,0,0.08)]">
            <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Đang tải...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
          <Link href="/" className="hidden lg:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm justify-center">
            <ArrowLeft className="size-4" /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

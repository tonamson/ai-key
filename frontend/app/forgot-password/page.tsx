"use client";

import { useState } from "react";
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
          <h1 className="text-3xl font-bold text-white mb-3">Đặt lại mật khẩu</h1>
          <p className="text-white/60 text-lg leading-relaxed">Nhập email và chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
        </div>
        <ul className="space-y-3">
          {[
            { icon: Zap, text: 'Link có hiệu lực 15 phút' },
            { icon: Shield, text: 'Bảo mật tuyệt đối' },
            { icon: CheckCircle2, text: 'Không cần liên hệ hỗ trợ' },
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthLeft />
      <div className="flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/" className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-2">
            <ArrowLeft className="size-4" /> Trang chủ
          </Link>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold">Quên mật khẩu</h2>
            <p className="text-muted-foreground text-sm">
              {sent ? "Kiểm tra hộp thư của bạn" : "Nhập email để nhận link đặt lại mật khẩu"}
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 dark:shadow-[0_0_20px_rgba(255,107,0,0.08)]">
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Nếu email <strong>{email}</strong> tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.
                  Link có hiệu lực trong <strong>15 phút</strong>.
                </p>
                <Link href="/login" className="block w-full text-center rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium hover:bg-muted/80 transition-colors text-foreground">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link href="/login" className="text-primary underline underline-offset-4">
                    ← Quay lại đăng nhập
                  </Link>
                </p>
              </form>
            )}
          </div>
          <Link href="/" className="hidden lg:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm justify-center">
            <ArrowLeft className="size-4" /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

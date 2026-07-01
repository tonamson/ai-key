"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth.store";
import { authService } from "@/lib/api/auth.service";
import { useRecaptcha } from "@/lib/hooks/use-recaptcha";
import { Key, CheckCircle2, Zap, Shield, ArrowLeft } from "lucide-react";

function AuthLeft() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12
      bg-gradient-to-br from-[#E85500] to-[#C94000]
      dark:from-[#0D0800] dark:to-[#2E1A00]">
      <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm">
        <ArrowLeft className="size-4" /> cheapaikey.store
      </Link>
      <div className="space-y-8">
        <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] dark:bg-[#FF6B00]/20 dark:shadow-[0_0_30px_rgba(255,107,0,0.35)]">
          <Key className="size-7 text-white dark:text-[#FF6B00]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">Tạo tài khoản</h1>
          <p className="text-white/60 text-lg leading-relaxed">Đăng ký miễn phí và mua API Key Claude trong vài phút.</p>
        </div>
        <ul className="space-y-3">
          {[
            { icon: Zap, text: 'Kích hoạt key trong 5 giây' },
            { icon: Shield, text: '100% API chính thức từ Anthropic' },
            { icon: CheckCircle2, text: 'Thanh toán chuyển khoản ngân hàng VN' },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-white/70">
              <Icon className="size-4 text-white/90 dark:text-[#78E4E2] shrink-0" />
              <span className="text-sm">{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-white/30 text-xs">© 2025 cheapaikey.store</p>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const { execute } = useRecaptcha();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    referredBy: "",
  });

  useEffect(() => {
    const fromUrl = searchParams.get('ref');
    if (fromUrl) {
      sessionStorage.setItem('ref_code', fromUrl.toUpperCase());
      setForm(f => ({ ...f, referredBy: fromUrl.toUpperCase() }));
    } else {
      const saved = sessionStorage.getItem('ref_code');
      if (saved) setForm(f => ({ ...f, referredBy: saved }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      const recaptchaToken = await execute("register");
      await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        recaptchaToken,
        referredBy: form.referredBy.trim().toUpperCase() || undefined,
      });
      sessionStorage.removeItem('ref_code');
      setRegistered(form.email);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        <AuthLeft />
        <div className="flex flex-col items-center justify-center p-8 bg-background">
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="size-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Kiểm tra email</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Chúng tôi đã gửi link xác thực đến <strong>{registered}</strong>.<br />
                Nhấn vào link trong email để kích hoạt tài khoản.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <Button variant="outline" className="w-full" onClick={async () => {
                try {
                  await authService.resendVerifyEmail(registered);
                  toast.success('Đã gửi lại email xác thực');
                } catch {
                  toast.error('Gửi lại thất bại, thử lại sau');
                }
              }}>Gửi lại email</Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary underline underline-offset-4">Quay lại đăng nhập</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
            <h2 className="text-2xl font-bold">Tạo tài khoản</h2>
            <p className="text-muted-foreground text-sm">Đăng ký để mua và sử dụng API Key</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 dark:shadow-[0_0_20px_rgba(20,133,255,0.08)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Họ tên</Label>
                <Input id="name" placeholder="Nguyễn Văn A" required value={form.name} onChange={set("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" required value={form.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input id="password" type="password" placeholder="Tối thiểu 6 ký tự" required minLength={6} value={form.password} onChange={set("password")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" required value={form.confirmPassword} onChange={set("confirmPassword")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="referredBy">Mã giới thiệu <span className="text-muted-foreground font-normal">(nếu có)</span></Label>
                <Input id="referredBy" placeholder="Nhập mã giới thiệu..." value={form.referredBy} onChange={set("referredBy")} className="font-mono uppercase" />
                {form.referredBy && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Sẽ liên kết với mã <strong>{form.referredBy.toUpperCase()}</strong>
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-primary underline underline-offset-4">Đăng nhập</Link>
            </p>
          </div>
          <Link href="/" className="hidden lg:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm justify-center">
            <ArrowLeft className="size-4" /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}

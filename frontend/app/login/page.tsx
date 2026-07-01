"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      bg-gradient-to-br from-[#1A0A00] to-[#2C1200]
      dark:from-[#0F0F11] dark:to-[#1E1A10]">
      <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm">
        <ArrowLeft className="size-4" /> cheapaikey.store
      </Link>
      <div className="space-y-8">
        <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] dark:bg-[#FF6B00]/20 dark:shadow-[0_0_30px_rgba(255,107,0,0.35)]">
          <Key className="size-7 text-white dark:text-[#FF6B00]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">cheapaikey.store</h1>
          <p className="text-white/60 text-lg leading-relaxed">API Key Claude giá rẻ, kích hoạt tức thì, thanh toán nội địa.</p>
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
      <p className="text-white/30 text-xs">© 2026 cheapaikey.store</p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, token } = useAuthStore();
  const { execute } = useRecaptcha();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const recaptchaToken = await execute("login");
      const result = await login({ email, password, recaptchaToken });
      if (result.requiresTwoFactor) {
        setTempToken(result.tempToken!);
      } else {
        toast.success("Đăng nhập thành công");
        router.replace("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? '';
      if (msg === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email);
      } else {
        toast.error(msg || 'Đăng nhập thất bại');
      }
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const data = await authService.verifyTwoFactor(tempToken!, otp);
      const { setAuthToken } = await import("@/lib/api/client");
      setAuthToken(data.accessToken);
      useAuthStore.setState({ token: data.accessToken, user: data.user });
      toast.success("Đăng nhập thành công");
      router.replace("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Mã xác thực không đúng");
    } finally {
      setOtpLoading(false);
    }
  }

  if (tempToken) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        <AuthLeft />
        <div className="flex flex-col items-center justify-center p-8 bg-background">
          <div className="w-full max-w-sm space-y-6">
            <Link href="/" className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-2">
              <ArrowLeft className="size-4" /> Trang chủ
            </Link>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">Xác thực 2 bước</h2>
              <p className="text-muted-foreground text-sm">Nhập mã 6 số từ ứng dụng xác thực</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 dark:shadow-[0_0_20px_rgba(255,107,0,0.08)]">
              <form onSubmit={handleOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Mã xác thực</Label>
                  <Input
                    id="otp"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={otpLoading || otp.length !== 6}>
                  {otpLoading ? "Đang xác thực..." : "Xác thực"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setTempToken(null)}>
                  ← Quay lại
                </Button>
              </form>
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
            <h2 className="text-2xl font-bold">Đăng nhập</h2>
            <p className="text-muted-foreground text-sm">Nhập email và mật khẩu để tiếp tục</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 dark:shadow-[0_0_20px_rgba(255,107,0,0.08)]">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {unverifiedEmail && (
                <p className="text-sm rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700 px-3 py-2 text-yellow-800 dark:text-yellow-300">
                  Email chưa được xác thực. Kiểm tra hộp thư hoặc{' '}
                  <button type="button" className="underline font-medium" onClick={async () => {
                    try {
                      await authService.resendVerifyEmail(unverifiedEmail);
                      toast.success('Đã gửi lại email xác thực');
                    } catch {
                      toast.error('Gửi lại thất bại, thử lại sau');
                    }
                  }}>gửi lại email</button>.
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-muted-foreground underline underline-offset-4">
                  Quên mật khẩu?
                </Link>
              </div>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-primary underline underline-offset-4">
                Đăng ký ngay
              </Link>
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

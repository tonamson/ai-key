"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth.store";
import { authService } from "@/lib/api/auth.service";
import { useRecaptcha } from "@/lib/hooks/use-recaptcha";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, token } = useAuthStore();
  const { execute } = useRecaptcha();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
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
      toast.error(
        err?.response?.data?.message ?? err?.message ?? "Đăng nhập thất bại",
      );
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
      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Mã xác thực không đúng",
      );
    } finally {
      setOtpLoading(false);
    }
  }

  if (tempToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Xác thực 2 bước
            </CardTitle>
            <CardDescription>Nhập mã 6 số từ ứng dụng xác thực</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Mã xác thực</Label>
                <Input
                  id="otp"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={otpLoading || otp.length !== 6}
              >
                {otpLoading ? "Đang xác thực..." : "Xác thực"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setTempToken(null)}
              >
                ← Quay lại
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Đăng nhập
          </CardTitle>
          <CardDescription>Nhập email và mật khẩu để tiếp tục</CardDescription>
        </CardHeader>
        <CardContent>
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
            <Link
              href="/register"
              className="text-primary underline underline-offset-4"
            >
              Đăng ký ngay
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

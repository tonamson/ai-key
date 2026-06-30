"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const { execute } = useRecaptcha();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState<string | null>(null); // email vừa đăng ký
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

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
      toast.error(
        err?.response?.data?.message ?? err?.message ?? "Đăng ký thất bại",
      );
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Kiểm tra email</CardTitle>
            <CardDescription>Chúng tôi đã gửi link xác thực đến <strong>{registered}</strong>. Nhấn vào link trong email để kích hoạt tài khoản.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
          <CardDescription>Đăng ký để mua và sử dụng API Key</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Họ tên</Label>
              <Input
                id="name"
                placeholder="Nguyễn Văn A"
                required
                value={form.name}
                onChange={set("name")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={set("email")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                required
                minLength={6}
                value={form.password}
                onChange={set("password")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                required
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="referredBy">Mã giới thiệu <span className="text-muted-foreground font-normal">(nếu có)</span></Label>
              <Input
                id="referredBy"
                placeholder="Nhập mã giới thiệu..."
                value={form.referredBy}
                onChange={set("referredBy")}
                className="font-mono uppercase"
              />
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
            <Link
              href="/login"
              className="text-primary underline underline-offset-4"
            >
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}

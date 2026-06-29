'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, ShieldOff, CheckCircle2, User, Lock, Shield, Gift, Copy, ExternalLink, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store/auth.store';
import { authService } from '@/lib/api/auth.service';
import { QRCodeCanvas } from '@/components/ui/qr-code';
import { getRoleLabel } from '@/lib/role-keys';
import { referralApi, walletApi, WalletTransaction } from '@/lib/api/admin.service';

type Section = 'info' | 'password' | 'security' | 'referral' | 'wallet';

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'info',     label: 'Thông tin',   icon: User },
  { id: 'password', label: 'Mật khẩu',    icon: Lock },
  { id: 'security', label: 'Bảo mật',     icon: Shield },
  { id: 'referral', label: 'Giới thiệu',  icon: Gift },
  { id: 'wallet',   label: 'Ví',          icon: Wallet },
];

const f = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export default function ProfilePage() {
  const { user, isLoading, updateProfile, setUser } = useAuthStore();
  const [active, setActive] = useState<Section>('info');
  const [referral, setReferral] = useState<{ id: string; code: string; totalEarned: number; commissionPercent: number } | null>(null);
  const [wallet, setWallet] = useState<{ balance: number; history: WalletTransaction[] } | null>(null);
  const [refCopied, setRefCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    referralApi.getMyCode().then(r => setReferral(r as any)).catch(() => {});
    walletApi.getMe().then(setWallet).catch(() => {});
  }, []);

  const refLink = referral ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${referral.code}` : '';
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  if (!user) return null;

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  function copyRef(text: string, type: 'code' | 'link') {
    navigator.clipboard.writeText(text).then(() => {
      setRefCopied(type);
      toast.success('Đã sao chép');
      setTimeout(() => setRefCopied(null), 2000);
    });
  }

  async function handleInfo(e: React.FormEvent) {
    e.preventDefault();
    try { await updateProfile({ name }); toast.success('Đã lưu thay đổi'); }
    catch (err) { toast.error((err as Error).message); }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    try {
      await updateProfile({ currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) { toast.error((err as Error).message); }
  }

  async function handleSetup2FA() {
    setTwoFaLoading(true);
    try { const r = await authService.setupTwoFactor(); setOtpauthUrl(r.otpauthUrl); }
    catch (err) { toast.error((err as Error).message); }
    finally { setTwoFaLoading(false); }
  }

  async function handleEnable2FA(e: React.FormEvent) {
    e.preventDefault(); setTwoFaLoading(true);
    try {
      await authService.enableTwoFactor(setupCode);
      setUser({ ...user!, twoFactorEnabled: true });
      setOtpauthUrl(null); setSetupCode('');
      toast.success('Đã bật xác thực 2 bước');
    } catch (err) { toast.error((err as Error).message); }
    finally { setTwoFaLoading(false); }
  }

  async function handleDisable2FA(e: React.FormEvent) {
    e.preventDefault(); setTwoFaLoading(true);
    try {
      await authService.disableTwoFactor(disableCode);
      setUser({ ...user!, twoFactorEnabled: false });
      setDisableCode('');
      toast.success('Đã tắt xác thực 2 bước');
    } catch (err) { toast.error((err as Error).message); }
    finally { setTwoFaLoading(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header — đồng bộ với dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý thông tin và bảo mật tài khoản</p>
        </div>
        <Badge variant="secondary">{getRoleLabel(user.roleKey)}</Badge>
      </div>

      {/* User summary card — đồng bộ style với các card trên dashboard */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="size-14 rounded-lg">
            <AvatarFallback className="rounded-lg text-base font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
          <Badge variant={user.twoFactorEnabled ? 'default' : 'secondary'} className="gap-1.5 shrink-0">
            {user.twoFactorEnabled
              ? <><ShieldCheck className="size-3" />2FA bật</>
              : <><ShieldOff className="size-3" />2FA tắt</>}
          </Badge>
        </CardContent>
      </Card>

      {/* Layout: side nav + content */}
      <div className="flex gap-6">
        {/* Nav */}
        <div className="w-48 shrink-0 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActive(id)}
              className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left transition-colors
                ${active === id
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {active === 'info' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật tên hiển thị trong hệ thống</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInfo} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user.email} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên</Label>
                      <Input id="name" value={name}
                        onChange={e => setName(e.target.value)} required />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isLoading || name === user.name}>
                      Lưu thay đổi
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {active === 'password' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
                <CardDescription>Không chia sẻ mật khẩu với người khác</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cur">Mật khẩu hiện tại</Label>
                    <Input id="cur" type="password" className="max-w-sm"
                      value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 max-w-sm sm:max-w-none">
                    <div className="space-y-2">
                      <Label htmlFor="new">Mật khẩu mới</Label>
                      <Input id="new" type="password" minLength={6}
                        value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cfm">Xác nhận mật khẩu mới</Label>
                      <Input id="cfm" type="password" minLength={6}
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isLoading}>
                      Đổi mật khẩu
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {active === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Xác thực 2 bước</CardTitle>
                <CardDescription>
                  {user.twoFactorEnabled
                    ? 'Tài khoản đang được bảo vệ bằng ứng dụng xác thực'
                    : 'Bật 2FA với Google Authenticator hoặc Authy'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  user.twoFactorEnabled
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
                    : 'bg-muted/40'}`}>
                  {user.twoFactorEnabled
                    ? <><CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Đang bật</span></>
                    : <><ShieldOff className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">Chưa bật</span></>}
                </div>

                <Separator />

                {!user.twoFactorEnabled ? (
                  !otpauthUrl ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Dùng ứng dụng xác thực để tạo mã OTP khi đăng nhập.
                      </p>
                      <Button onClick={handleSetup2FA} disabled={twoFaLoading} size="sm">
                        <ShieldCheck className="mr-1.5 size-3.5" />Thiết lập 2FA
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleEnable2FA} className="space-y-4">
                      <p className="text-sm text-muted-foreground">Quét mã QR, sau đó nhập mã 6 số để xác nhận:</p>
                      <div className="inline-block rounded-lg border p-3 bg-white">
                        <QRCodeCanvas value={otpauthUrl} size={160} />
                      </div>
                      <div className="flex items-center gap-3 max-w-xs">
                        <Input placeholder="000000" maxLength={6} autoFocus
                          className="font-mono tracking-widest text-center"
                          value={setupCode}
                          onChange={e => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                        <Button type="submit" size="sm" disabled={twoFaLoading || setupCode.length !== 6}>
                          Xác nhận
                        </Button>
                      </div>
                      <Button type="button" variant="ghost" size="sm"
                        onClick={() => { setOtpauthUrl(null); setSetupCode(''); }}>
                        Huỷ
                      </Button>
                    </form>
                  )
                ) : (
                  <form onSubmit={handleDisable2FA} className="space-y-4">
                    <p className="text-sm text-muted-foreground">Nhập mã từ ứng dụng xác thực để tắt 2FA:</p>
                    <div className="flex items-center gap-3 max-w-xs">
                      <Input placeholder="000000" maxLength={6}
                        className="font-mono tracking-widest text-center"
                        value={disableCode}
                        onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                      <Button type="submit" variant="destructive" size="sm"
                        disabled={twoFaLoading || disableCode.length !== 6}>
                        <ShieldOff className="mr-1.5 size-3.5" />Tắt
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {active === 'wallet' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Ví của tôi</span>
                  <span className="text-primary font-bold text-lg">{f(wallet?.balance ?? 0)}đ</span>
                </CardTitle>
                <CardDescription>Lịch sử giao dịch ví — hoa hồng & chi tiêu</CardDescription>
              </CardHeader>
              <CardContent>
                {!wallet || wallet.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Chưa có giao dịch nào</p>
                ) : (
                  <div className="divide-y">
                    {wallet.history.map(tx => {
                      const isCredit = Number(tx.amount) > 0;
                      const typeLabel: Record<string, string> = {
                        commission: 'Hoa hồng giới thiệu',
                        spend: 'Thanh toán mua key',
                        admin_add: 'Admin nạp',
                        admin_sub: 'Admin trừ',
                      };
                      return (
                        <div key={tx.id} className="flex items-center justify-between py-3 gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                              {isCredit
                                ? <ArrowDownLeft className="size-4 text-green-600 dark:text-green-400" />
                                : <ArrowUpRight className="size-4 text-red-500" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{typeLabel[tx.type] ?? tx.type}</p>
                              <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold tabular-nums ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            {isCredit ? '+' : ''}{f(Number(tx.amount))}đ
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {active === 'referral' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chương trình giới thiệu</CardTitle>
                <CardDescription>Chia sẻ link đăng ký — nhận hoa hồng khi bạn bè mua hàng thành công</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {referral ? (
                  <>
                    {/* Hoa hồng */}
                    <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium">Tổng hoa hồng nhận được</span>
                      <span className="text-lg font-bold text-primary">{f(referral.totalEarned)}đ</span>
                    </div>

                    {/* Mã */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Mã giới thiệu</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-muted rounded-lg px-4 py-2.5 font-mono text-base tracking-[0.25em] text-center font-semibold">
                          {referral.code}
                        </code>
                        <button onClick={() => copyRef(referral.code, 'code')}
                          className="h-10 px-3 rounded-lg border bg-background hover:bg-muted transition-colors flex items-center gap-1.5 text-sm shrink-0">
                          {refCopied === 'code' ? <CheckCircle2 className="size-4 text-green-500" /> : <Copy className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Link */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Link đăng ký giới thiệu</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-xs font-mono truncate text-muted-foreground">
                          {refLink}
                        </code>
                        <button onClick={() => copyRef(refLink, 'link')}
                          className="h-10 px-3 rounded-lg border bg-background hover:bg-muted transition-colors flex items-center gap-1.5 text-sm shrink-0">
                          {refCopied === 'link' ? <CheckCircle2 className="size-4 text-green-500" /> : <Copy className="size-4" />}
                        </button>
                        <a href={refLink} target="_blank" rel="noopener noreferrer"
                          className="h-10 px-3 rounded-lg border bg-background hover:bg-muted transition-colors flex items-center shrink-0">
                          <ExternalLink className="size-4" />
                        </a>
                      </div>
                    </div>

                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      Khi bạn bè đăng ký qua link của bạn và mua hàng thành công, bạn sẽ nhận % hoa hồng trên mỗi đơn hàng.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Đang tải...</p>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

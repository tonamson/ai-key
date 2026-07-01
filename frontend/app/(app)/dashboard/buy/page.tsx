'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronRight, Clock, Coins, Loader2, Sparkles, Tag, Copy, CheckCircle2, ArrowLeft, Wallet, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { planApi, couponApi, orderApi, walletApi, Plan, Coupon, Order } from '@/lib/api/admin.service';

const f = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const memo = (o: Order) => o.transferMemo ?? o.id.replace(/-/g, '');

// ── Step indicator ─────────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ['Chọn gói', 'Xác nhận', 'Thanh toán'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 dark:shadow-[0_0_10px_rgba(255,107,0,0.4)]' : 'bg-muted text-muted-foreground'}`}>
                {done ? <Check className="size-3.5" /> : idx}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Plan card ──────────────────────────────────────────────────────────────────
const POPULAR_NAMES = ['pro', 'standard', 'basic plus'];

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: () => void }) {
  const isPopular = POPULAR_NAMES.some(n => plan.name.toLowerCase().includes(n));
  return (
    <button
      onClick={onSelect}
      className={`group relative text-left rounded-2xl border-2 bg-card p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isPopular ? 'border-primary dark:shadow-[0_0_25px_rgba(255,107,0,0.3)]' : 'border-border hover:border-primary/60'}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#E85500] to-[#FF6B00] text-white text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="size-3" /> Phổ biến nhất
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg leading-tight">{plan.name}</h3>
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
            <Clock className="size-3" />
            <span className="text-xs">{plan.durationDays} ngày</span>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
      </div>

      <div className="mb-5">
        <span className="text-3xl font-extrabold tracking-tight">{f(plan.price)}</span>
        <span className="text-muted-foreground text-sm font-medium ml-1">đ</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2.5 text-sm">
          <div className="size-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <Coins className="size-3 text-green-600 dark:text-green-400" />
          </div>
          <span>{f(plan.tokenQuota)} token</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="size-3 text-primary" />
          </div>
          <span>Hiệu lực {plan.durationDays} ngày</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <div className="size-5 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
            <Check className="size-3 text-primary" />
          </div>
          <span>API key riêng biệt</span>
        </div>
      </div>

      <div className={`mt-5 pt-4 border-t ${isPopular ? 'border-primary/20' : 'border-border'}`}>
        <div className={`w-full py-2 rounded-lg text-sm font-semibold text-center transition-colors ${isPopular ? 'bg-primary text-primary-foreground' : 'bg-muted group-hover:bg-primary group-hover:text-primary-foreground'}`}>
          Chọn gói này
        </div>
      </div>
    </button>
  );
}

// ── Step 2: Confirm ────────────────────────────────────────────────────────────
function StepConfirm({
  plan,
  couponCode, setCouponCode,
  coupon, setCoupon,
  walletBalance, useWallet, setUseWallet,
  walletUsed, discount, finalPrice,
  creating,
  onBack, onSubmit,
}: {
  plan: Plan;
  couponCode: string; setCouponCode: (v: string) => void;
  coupon: Coupon | null; setCoupon: (v: Coupon | null) => void;
  walletBalance: number; useWallet: boolean; setUseWallet: (v: boolean) => void;
  walletUsed: number; discount: number; finalPrice: number;
  creating: boolean;
  onBack: () => void; onSubmit: () => void;
}) {
  async function validateCoupon() {
    if (!couponCode.trim()) return;
    try {
      const c = await couponApi.validate(couponCode.trim());
      setCoupon(c);
      toast.success('Mã hợp lệ');
    } catch (e) {
      setCoupon(null);
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Summary card */}
      <div className="rounded-2xl border bg-card shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Gói đã chọn</p>
            <h3 className="font-bold text-xl">{plan.name}</h3>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">{plan.durationDays} ngày</Badge>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Coins className="size-3.5" />{f(plan.tokenQuota)} token</span>
          <span className="flex items-center gap-1.5"><Clock className="size-3.5" />Hết hạn sau {plan.durationDays} ngày</span>
        </div>
      </div>

      {/* Coupon */}
      <div className="rounded-2xl border bg-card shadow-sm p-5">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Tag className="size-3.5" /> Mã giảm giá
          </Label>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCoupon(null); }}
              placeholder="Nhập mã giảm giá..."
              className="font-mono uppercase"
            />
            <Button type="button" variant="outline" onClick={validateCoupon} disabled={!couponCode.trim()}>
              Áp dụng
            </Button>
          </div>
          {coupon && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Giảm {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `${f(coupon.discountValue)}đ`}
            </p>
          )}
        </div>
      </div>

      {/* Ví */}
      {walletBalance > 0 && (
        <div className="rounded-2xl border bg-card shadow-sm p-5">
          <label className="flex items-center justify-between cursor-pointer gap-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Wallet className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Dùng số dư ví</p>
                <p className="text-xs text-muted-foreground">Số dư: <strong>{f(walletBalance)}đ</strong></p>
              </div>
            </div>
            <input type="checkbox" checked={useWallet} onChange={e => setUseWallet(e.target.checked)}
              className="size-4 accent-primary cursor-pointer" />
          </label>
          {useWallet && walletUsed > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Sẽ trừ {f(walletUsed)}đ từ ví
            </p>
          )}
        </div>
      )}

      {/* Price breakdown */}
      <div className="rounded-2xl border bg-card shadow-sm p-5 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Chi tiết đơn hàng</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Giá gốc</span>
            <span>{f(plan.price)}đ</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Giảm giá</span>
              <span>-{f(discount)}đ</span>
            </div>
          )}
          {walletUsed > 0 && (
            <div className="flex justify-between text-primary">
              <span className="flex items-center gap-1"><Wallet className="size-3" />Số dư ví</span>
              <span>-{f(walletUsed)}đ</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
            <span>Thành tiền</span>
            <span className="text-primary text-lg">{f(finalPrice)}đ</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-1.5">
          <ArrowLeft className="size-4" /> Quay lại
        </Button>
        <Button className="flex-1 font-semibold" disabled={creating} onClick={onSubmit}>
          {creating ? <><Loader2 className="size-4 animate-spin mr-2" />Đang tạo đơn...</> : 'Tiến hành thanh toán →'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Payment ────────────────────────────────────────────────────────────
function StepPayment({ order, vietQRUrl }: { order: Order; vietQRUrl: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      toast.success('Đã sao chép');
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copy(text, id)}
      className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      {copied === id ? <CheckCircle2 className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
    </button>
  );

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* QR */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 flex flex-col items-center gap-4">
          {vietQRUrl && <img src={vietQRUrl} alt="VietQR" className="w-52 h-52 rounded-xl shadow-md bg-white p-1" />}
          <p className="text-sm text-muted-foreground">Quét mã QR bằng app ngân hàng</p>
        </div>

        {/* Transfer info */}
        <div className="p-5 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thông tin chuyển khoản</h4>
          {[
            { label: 'Ngân hàng', value: 'TECHCOMBANK', id: 'bank' },
            { label: 'Số tài khoản', value: '19032009391010', id: 'acct', mono: true },
            { label: 'Số tiền', value: `${f(order.finalPrice)}đ`, id: 'amt', bold: true },
          ].map(row => (
            <div key={row.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm ${row.mono ? 'font-mono' : ''} ${row.bold ? 'font-bold text-primary text-base' : 'font-medium'}`}>{row.value}</span>
                <CopyBtn text={row.value.replace('đ', '')} id={row.id} />
              </div>
            </div>
          ))}
          {/* Transfer content */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Nội dung CK</span>
            <div className="flex items-center gap-1.5">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{memo(order)}</code>
              <CopyBtn text={memo(order)} id="content" />
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground py-3">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span>Đang chờ xác nhận thanh toán...</span>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Sau khi chuyển khoản thành công, hệ thống sẽ tự động kích hoạt key cho bạn.
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BuyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [vietQRUrl, setVietQRUrl] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [renewId, setRenewId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    planApi.listPublic().then(setPlans).catch(e => toast.error(e.message));
    walletApi.getMe().then(r => setWalletBalance(r.balance)).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    // Đọc ?renew=<subId> để gia hạn đúng key cũ
    const renew = params.get('renew');
    if (renew) setRenewId(renew);
    // Đọc ?order=<id> để hiển thị thông tin thanh toán đơn đang chờ
    const orderId = params.get('order');
    if (orderId) {
      orderApi.listMine().then(orders => {
        const found = orders.find(o => o.id === orderId && o.status === 'pending');
        if (found) {
          const qr = found.finalPrice > 0
            ? `https://img.vietqr.io/image/TECHCOMBANK-19032009391010-compact.png?amount=${found.finalPrice}&addInfo=${memo(found)}`
            : '';
          setOrder(found);
          setVietQRUrl(qr);
          setStep(3);
        }
      }).catch(() => {});
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function calcDiscount(): number {
    if (!selectedPlan || !coupon) return 0;
    if (coupon.discountType === 'percent') return Math.min(selectedPlan.price * coupon.discountValue / 100, selectedPlan.price);
    return Math.min(coupon.discountValue, selectedPlan.price);
  }

  function calcWalletUsed(): number {
    if (!useWallet || !selectedPlan || walletBalance <= 0) return 0;
    return Math.min(walletBalance, selectedPlan.price - calcDiscount());
  }

  async function handleSubmit() {
    if (!selectedPlan) return;
    setCreating(true);
    try {
      const res = await orderApi.create({
        planId: selectedPlan.id,
        couponCode: coupon ? couponCode.trim() : undefined,
        useWallet: useWallet && walletBalance > 0,
        renewSubscriptionId: renewId ?? undefined,
      });
      setOrder(res.order);
      setVietQRUrl(res.vietQRUrl);
      setStep(3);

      pollRef.current = setInterval(async () => {
        try {
          const orders = await orderApi.listMine();
          const found = orders.find(o => o.id === res.order.id);
          if (found?.status === 'paid') {
            clearInterval(pollRef.current!);
            toast.success('Thanh toán thành công!');
            router.push('/dashboard/my-keys');
          }
        } catch { /* ignore */ }
      }, 5000);
    } catch (e) { toast.error((e as Error).message); }
    finally { setCreating(false); }
  }

  const discount = calcDiscount();
  const walletUsed = calcWalletUsed();
  const finalPrice = selectedPlan ? Math.max(0, selectedPlan.price - discount - walletUsed) : 0;

  return (
    <div className="space-y-2 pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{renewId ? 'Gia hạn key' : 'Mua key API'}</h1>
        <p className="text-muted-foreground mt-1">{renewId ? 'Chọn gói để cộng thêm hạn dùng & quota vào key hiện tại' : 'Chọn gói phù hợp, thanh toán nhanh qua QR'}</p>
      </div>

      {renewId && (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm text-primary flex items-center gap-2">
          <RefreshCw className="size-4 shrink-0" />
          Bạn đang gia hạn key cũ — key giữ nguyên, thời hạn và quota của gói sẽ được cộng dồn.
        </div>
      )}

      <Steps current={step} />

      {step === 1 && (
        <>
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="size-8 animate-spin opacity-40" />
              <p className="text-sm">Đang tải danh sách gói...</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map(p => (
                <PlanCard key={p.id} plan={p} onSelect={() => { setSelectedPlan(p); setStep(2); }} />
              ))}
            </div>
          )}
        </>
      )}

      {step === 2 && selectedPlan && (
        <StepConfirm
          plan={selectedPlan}
          couponCode={couponCode} setCouponCode={setCouponCode}
          coupon={coupon} setCoupon={setCoupon}
          walletBalance={walletBalance} useWallet={useWallet} setUseWallet={setUseWallet}
          walletUsed={walletUsed} discount={discount} finalPrice={finalPrice}
          creating={creating}
          onBack={() => setStep(1)} onSubmit={handleSubmit}
        />
      )}

      {step === 3 && order && (
        <StepPayment order={order} vietQRUrl={vietQRUrl} />
      )}
    </div>
  );
}

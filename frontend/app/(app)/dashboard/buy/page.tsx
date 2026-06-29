'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { planApi, couponApi, orderApi, Plan, Coupon, Order } from '@/lib/api/admin.service';

export default function BuyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [vietQRUrl, setVietQRUrl] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const f = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  useEffect(() => {
    planApi.listPublic().then(setPlans).catch(e => toast.error(e.message));
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

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

  function calcDiscount(): number {
    if (!selectedPlan || !coupon) return 0;
    if (coupon.discountType === 'percent') return Math.min(selectedPlan.price * (coupon.discountValue / 100), selectedPlan.price);
    return Math.min(coupon.discountValue, selectedPlan.price);
  }

  async function handleSubmit() {
    if (!selectedPlan) return;
    setCreating(true);
    try {
      const res = await orderApi.create({
        planId: selectedPlan.id,
        couponCode: coupon ? couponCode.trim() : undefined,
        referralCode: referralCode.trim() || undefined,
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
            router.push('/dashboard/keys');
          }
        } catch { /* ignore */ }
      }, 5000);
    } catch (e) { toast.error((e as Error).message); }
    finally { setCreating(false); }
  }

  const discount = calcDiscount();
  const finalPrice = selectedPlan ? selectedPlan.price - discount : 0;

  if (step === 3 && order) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold">Thanh toán VietQR</h1>
          <p className="text-sm text-muted-foreground">Quét mã QR để hoàn tất thanh toán</p>
        </div>
        <div className="rounded-lg border bg-background p-4 space-y-4">
          <img src={vietQRUrl} alt="VietQR" className="w-full max-w-xs mx-auto rounded-lg" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Ngân hàng</span><span className="font-medium">TECHCOMBANK</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Số tài khoản</span><span className="font-medium font-mono">19032009391010</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Số tiền</span><span className="font-bold text-lg">{f(order.finalPrice)}đ</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Nội dung</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-0.5 rounded">AIKEY-{order.id.slice(0, 8)}</code>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => navigator.clipboard.writeText(`AIKEY-${order.id}`).then(() => toast.success('Đã copy'))}>Copy</Button>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-center text-muted-foreground">Đang chờ xác nhận thanh toán...</p>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold">Xác nhận đơn hàng</h1>
          <p className="text-sm text-muted-foreground">Gói: <strong>{selectedPlan?.name}</strong></p>
        </div>
        <div className="rounded-lg border bg-background p-4 space-y-3">
          <div className="space-y-1">
            <Label>Mã giảm giá (tuỳ chọn)</Label>
            <div className="flex gap-2">
              <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="VD: SAVE10" />
              <Button type="button" variant="outline" onClick={validateCoupon}>Áp dụng</Button>
            </div>
            {coupon && <p className="text-xs text-green-600">Giảm: {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `${f(coupon.discountValue)}đ`}</p>}
          </div>
          <div className="space-y-1">
            <Label>Mã giới thiệu (tuỳ chọn)</Label>
            <Input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="VD: ABC12345" />
          </div>
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Giá gốc</span><span>{f(selectedPlan?.price ?? 0)}đ</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{f(discount)}đ</span></div>}
            <div className="flex justify-between font-bold text-base"><span>Thành tiền</span><span>{f(finalPrice)}đ</span></div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(1)}>Quay lại</Button>
          <Button className="flex-1" disabled={creating} onClick={handleSubmit}>{creating ? 'Đang tạo...' : 'Tiến hành thanh toán'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Mua key</h1>
        <p className="text-sm text-muted-foreground">Chọn gói phù hợp với nhu cầu của bạn</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map(p => (
          <button key={p.id} onClick={() => { setSelectedPlan(p); setStep(2); }}
            className="text-left rounded-lg border bg-background p-5 hover:border-primary hover:shadow transition-all space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <Badge variant="outline">{p.durationDays} ngày</Badge>
            </div>
            <p className="text-2xl font-bold">{f(p.price)}<span className="text-sm font-normal text-muted-foreground">đ</span></p>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5"><Check className="size-3.5 text-green-500" />{f(p.tokenQuota)} token</div>
              <div className="flex items-center gap-1.5"><Check className="size-3.5 text-green-500" />Hiệu lực {p.durationDays} ngày</div>
            </div>
          </button>
        ))}
        {plans.length === 0 && <div className="col-span-3 text-center text-muted-foreground py-12">Chưa có gói nào</div>}
      </div>
    </div>
  );
}

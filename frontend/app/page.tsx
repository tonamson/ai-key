import Link from 'next/link';
import { Suspense } from 'react';
import { Zap, Shield, Clock, Key, ArrowRight, CheckCircle2, Cpu, Globe } from 'lucide-react';
import RefHandler from '@/components/ref-handler';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:2053';

async function getPlans() {
  try {
    const res = await fetch(`${API_URL}/plans`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function fmtPrice(price: number) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

function fmtTokens(t: number) {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(0)}M tokens`;
  if (t >= 1_000) return `${(t / 1_000).toFixed(0)}K tokens`;
  return `${t} tokens`;
}

export default async function LandingPage() {
  const plans: any[] = await getPlans();

  return (
    <div className="min-h-screen bg-[#06090F] text-[#EEF4FF]">

      {/* Xử lý ?ref= param */}
      <Suspense><RefHandler /></Suspense>

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#14485F]/60 bg-[#06090F]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/banner.png" alt="cheapaikey.store" className="h-8 w-auto" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#78A8B8] hover:text-[#EEF4FF] transition-colors px-3 py-2">
              Đăng nhập
            </Link>
            <Link href="/register"
              className="text-sm bg-[#1485FF] hover:bg-[#0B6FD4] text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#1485FF]/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#78E4E2]/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#0B1F3A] border border-[#14485F] rounded-full px-4 py-1.5 text-sm text-[#78E4E2] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#78E4E2] animate-pulse" />
            API Key Claude · Giá rẻ nhất Việt Nam
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Dùng Claude AI<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1485FF] to-[#78E4E2]">
              không giới hạn
            </span>
          </h1>
          <p className="text-lg text-[#78A8B8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Mua API Key Claude với giá phải chăng. Tích hợp ngay với{' '}
            <strong className="text-[#EEF4FF]">Claude Code</strong>, Cursor, hay bất kỳ ứng dụng nào —
            không cần thẻ Visa quốc tế.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#1485FF] hover:bg-[#0B6FD4] text-white px-8 py-3.5 rounded-lg font-semibold text-base transition-colors">
              Bắt đầu ngay <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#pricing"
              className="inline-flex items-center justify-center gap-2 bg-[#0B1F3A] hover:bg-[#0D2540] border border-[#14485F] text-[#EEF4FF] px-8 py-3.5 rounded-lg font-semibold text-base transition-colors">
              Xem bảng giá
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-[#14485F]/40">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {([
            { icon: Zap,    color: '#F4D22B', title: 'Kích hoạt tức thì',    desc: 'Nhận API Key ngay sau khi thanh toán, không cần chờ duyệt thủ công' },
            { icon: Shield, color: '#78E4E2', title: 'Bảo mật tuyệt đối',    desc: 'Key được mã hoá, chỉ bạn mới có thể xem sau khi đăng nhập' },
            { icon: Clock,  color: '#1485FF', title: 'Thanh toán nội địa',   desc: 'Chuyển khoản ngân hàng Việt Nam, không cần Visa/Mastercard' },
            { icon: Globe,  color: '#78E4E2', title: 'Tương thích mọi app', desc: 'Claude Code, Cursor, API trực tiếp — dùng được ở bất kỳ đâu' },
          ] as const).map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-[#0B1F3A] border border-[#14485F] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-[#EEF4FF] mb-2">{title}</h3>
              <p className="text-sm text-[#78A8B8] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Bắt đầu trong 3 bước</h2>
          <p className="text-[#78A8B8] mb-14">Từ đăng ký đến dùng Claude — chưa đến 5 phút</p>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-[#14485F] to-transparent" />
            {([
              { step: '1', icon: Key,  color: '#1485FF', title: 'Tạo tài khoản',       desc: 'Đăng ký miễn phí bằng email, không cần thẻ' },
              { step: '2', icon: Cpu,  color: '#78E4E2', title: 'Chọn gói & thanh toán', desc: 'Chuyển khoản ngân hàng nội địa, hệ thống tự xác nhận' },
              { step: '3', icon: Zap,  color: '#F4D22B', title: 'Nhận Key & dùng ngay', desc: 'Copy API Key, dán vào Claude Code hoặc bất kỳ app nào' },
            ] as const).map(({ step, icon: Icon, color, title, desc }) => (
              <div key={step} className="flex flex-col items-center gap-3 relative z-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-[#14485F] bg-[#0B1F3A]"
                  style={{ boxShadow: `0 0 24px ${color}20` }}>
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <span className="text-xs font-mono text-[#4D7A8A]">Bước {step}</span>
                <h3 className="font-semibold text-[#EEF4FF]">{title}</h3>
                <p className="text-sm text-[#78A8B8] text-center leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-[#14485F]/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Bảng giá</h2>
            <p className="text-[#78A8B8]">Chọn gói phù hợp, thanh toán một lần, dùng ngay</p>
          </div>

          {plans.length === 0 ? (
            <p className="text-center text-[#4D7A8A] py-12">Đang tải gói dịch vụ...</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {plans.map((plan: any, i: number) => {
                const isPopular = plans.length > 1 && i === Math.floor(plans.length / 2);
                return (
                  <div key={plan.id}
                    className={`relative flex flex-col rounded-2xl p-7 border w-full max-w-xs transition-all ${
                      isPopular
                        ? 'bg-[#0D2540] border-[#1485FF] shadow-[0_0_40px_#1485FF18]'
                        : 'bg-[#0B1F3A] border-[#14485F] hover:border-[#1485FF]/40'
                    }`}>
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#1485FF] text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                        Phổ biến nhất
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-[#EEF4FF] mb-1">{plan.name}</h3>
                    <div className="flex items-end gap-1 mt-3 mb-1">
                      <span className="text-4xl font-bold text-[#EEF4FF]">{fmtPrice(plan.price)}</span>
                    </div>
                    <p className="text-sm text-[#78A8B8] mb-6">{plan.durationDays} ngày</p>

                    <ul className="flex flex-col gap-3 mb-8">
                      {[
                        fmtTokens(plan.tokenQuota) + ' token quota',
                        `${plan.durationDays} ngày hiệu lực`,
                        'Kích hoạt tức thì',
                        'Tích hợp Claude Code',
                        'Hỗ trợ gia hạn',
                      ].map(feat => (
                        <li key={feat} className="flex items-center gap-2.5 text-sm text-[#8BA8B8]">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#78E4E2]" />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <Link href="/register"
                      className={`mt-auto flex items-center justify-center gap-2 py-3 px-5 rounded-lg font-semibold text-sm transition-colors ${
                        isPopular
                          ? 'bg-[#1485FF] hover:bg-[#0B6FD4] text-white'
                          : 'bg-[#0D2540] hover:bg-[#142A4A] border border-[#14485F] hover:border-[#1485FF]/60 text-[#EEF4FF]'
                      }`}>
                      Mua ngay <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-[#14485F]/40">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Sẵn sàng dùng Claude<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1485FF] to-[#78E4E2]">
              với giá tốt nhất?
            </span>
          </h2>
          <p className="text-[#78A8B8] mb-8">Đăng ký ngay hôm nay, kích hoạt trong vài phút.</p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-[#1485FF] hover:bg-[#0B6FD4] text-white px-8 py-3.5 rounded-lg font-semibold text-base transition-colors">
            Tạo tài khoản miễn phí <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#14485F]/40 py-8 px-6 text-center">
        <p className="text-sm text-[#4D7A8A]">
          © 2025{' '}
          <a href="https://cheapaikey.store" className="text-[#78A8B8] hover:text-[#EEF4FF] transition-colors">
            cheapaikey.store
          </a>{' '}
          · Affordable AI API Keys
        </p>
      </footer>

    </div>
  );
}

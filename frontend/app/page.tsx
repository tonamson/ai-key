import Link from 'next/link';
import { Suspense } from 'react';
import {
  Zap, Shield, Clock, Key, ArrowRight, CheckCircle2, Cpu, Globe,
  Code2, MessageSquare, Brain, Terminal, ChevronDown, Star,
  TrendingUp, Users, Layers, BadgeCheck, Rocket, BookOpen,
} from 'lucide-react';
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
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(0)}M`;
  if (t >= 1_000) return `${(t / 1_000).toFixed(0)}K`;
  return `${t}`;
}

// ─── reusable pieces ────────────────────────────────────────────────────────

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-[#0B1F3A] border border-[#14485F] rounded-full px-4 py-1.5 text-sm text-[#78E4E2] mb-5">
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl sm:text-4xl font-bold text-[#EEF4FF] mb-4">{children}</h2>;
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return <p className="text-[#78A8B8] text-lg leading-relaxed">{children}</p>;
}

// ─── FAQ data ────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'cheapaikey.store là gì?',
    a: 'Chúng tôi cung cấp API Key Claude (Anthropic) dạng gói tháng với giá phải chăng, thanh toán bằng chuyển khoản nội địa Việt Nam. Bạn dùng key này thay thế trực tiếp cho API key của Anthropic.',
  },
  {
    q: 'Tôi có cần thẻ Visa/Mastercard không?',
    a: 'Không. Chúng tôi chấp nhận chuyển khoản ngân hàng nội địa (Vietcombank, Techcombank, MB...). Hệ thống xác nhận tự động sau khi nhận được tiền.',
  },
  {
    q: 'API Key hoạt động với Claude Code không?',
    a: 'Có, hoạt động 100%. Chỉ cần đặt ANTHROPIC_API_KEY=<key của bạn> là dùng được ngay với Claude Code, Cursor, Continue và mọi tool hỗ trợ Anthropic API.',
  },
  {
    q: 'Token quota là gì? Hết quota thì sao?',
    a: 'Token quota là giới hạn tổng token (input + output) bạn được dùng trong gói. Khi hết quota, key tạm dừng cho đến khi gia hạn. Quota chưa dùng hết sẽ được cộng dồn khi gia hạn.',
  },
  {
    q: 'Mua xong bao lâu nhận được key?',
    a: 'Ngay lập tức. Hệ thống tự động xác nhận thanh toán và kích hoạt key trong vài giây. Bạn nhận email xác nhận kèm key ngay sau đó.',
  },
  {
    q: 'Có thể gia hạn gói không?',
    a: 'Có. Bạn gia hạn bất cứ lúc nào trong dashboard. Nếu gia hạn trước khi hết hạn, thời gian được cộng dồn từ ngày hết hạn hiện tại.',
  },
];

// ─── page ────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const plans: any[] = await getPlans();

  return (
    <div className="min-h-screen bg-[#06090F] text-[#EEF4FF] overflow-x-hidden">
      <Suspense><RefHandler /></Suspense>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#14485F]/60 bg-[#06090F]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/banner.png" alt="cheapaikey.store" className="h-8 w-auto" />
          <div className="hidden sm:flex items-center gap-6 text-sm text-[#78A8B8]">
            <a href="#features" className="hover:text-[#EEF4FF] transition-colors">Tính năng</a>
            <a href="#how" className="hover:text-[#EEF4FF] transition-colors">Cách dùng</a>
            <a href="#pricing" className="hover:text-[#EEF4FF] transition-colors">Bảng giá</a>
            <a href="#faq" className="hover:text-[#EEF4FF] transition-colors">FAQ</a>
          </div>
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

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#1485FF]/6 rounded-full blur-[130px]" />
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-[#78E4E2]/4 rounded-full blur-[100px]" />
          {/* grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#78E4E2 1px,transparent 1px),linear-gradient(90deg,#78E4E2 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#0B1F3A] border border-[#14485F] rounded-full px-4 py-1.5 text-sm text-[#78E4E2] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#78E4E2] animate-pulse" />
            API Key Claude chính thức · Thanh toán nội địa Việt Nam
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Dùng <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1485FF] to-[#78E4E2]">Claude AI</span><br />
            không giới hạn
          </h1>

          <p className="text-xl text-[#78A8B8] max-w-2xl mx-auto mb-10 leading-relaxed">
            API Key Claude giá rẻ, kích hoạt tức thì, thanh toán qua ngân hàng Việt Nam.
            Tương thích 100% với <strong className="text-[#EEF4FF]">Claude Code</strong>, Cursor và mọi tool AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#1485FF] hover:bg-[#0B6FD4] text-white px-8 py-4 rounded-xl font-semibold text-base transition-colors shadow-[0_0_32px_#1485FF30]">
              Bắt đầu miễn phí <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#pricing"
              className="inline-flex items-center justify-center gap-2 bg-[#0B1F3A] hover:bg-[#0D2540] border border-[#14485F] text-[#EEF4FF] px-8 py-4 rounded-xl font-semibold text-base transition-colors">
              Xem bảng giá <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { val: '5x', label: 'rẻ hơn mua trực tiếp' },
              { val: '< 5s', label: 'kích hoạt key' },
              { val: '24/7', label: 'hoạt động liên tục' },
            ].map(({ val, label }) => (
              <div key={label} className="bg-[#0B1F3A]/60 border border-[#14485F]/60 rounded-xl py-4 px-3">
                <p className="text-2xl font-bold text-[#78E4E2]">{val}</p>
                <p className="text-xs text-[#78A8B8] mt-1 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-[#14485F]/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionTag><Brain className="w-3.5 h-3.5" /> Bạn dùng Claude để làm gì?</SectionTag>
            <SectionHeading>Mọi tác vụ AI — một API Key</SectionHeading>
            <SectionSub>Từ lập trình đến viết lách, phân tích dữ liệu đến tự động hoá</SectionSub>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Code2, color: '#1485FF',
                title: 'Lập trình với Claude Code',
                desc: 'Viết code, debug, review PR, refactor codebase toàn bộ dự án. Claude Code tích hợp terminal, hiểu context toàn bộ repo.',
                tags: ['Claude Code', 'Cursor', 'Continue'],
              },
              {
                icon: MessageSquare, color: '#78E4E2',
                title: 'Chatbot & trợ lý AI',
                desc: 'Xây dựng chatbot thông minh cho website, app. Claude có khả năng hiểu ngữ cảnh dài, trả lời tự nhiên bằng tiếng Việt.',
                tags: ['Chatbot', 'Customer support', 'RAG'],
              },
              {
                icon: BookOpen, color: '#F4D22B',
                title: 'Viết lách & sáng tạo nội dung',
                desc: 'Viết bài blog, email marketing, kịch bản video, mô tả sản phẩm. Tạo nội dung chuyên nghiệp hàng loạt với API.',
                tags: ['Content', 'Copywriting', 'SEO'],
              },
              {
                icon: TrendingUp, color: '#1485FF',
                title: 'Phân tích dữ liệu & báo cáo',
                desc: 'Phân tích CSV, tóm tắt tài liệu dài, trích xuất thông tin từ văn bản không cấu trúc. Biến dữ liệu thô thành insight.',
                tags: ['Analytics', 'Summarization', 'Extraction'],
              },
              {
                icon: Terminal, color: '#78E4E2',
                title: 'Tự động hoá công việc',
                desc: 'Kết hợp Claude với Python, n8n, Make để tự động hoá email, phân loại ticket, xử lý form — không cần lập trình viên.',
                tags: ['Automation', 'n8n', 'Python'],
              },
              {
                icon: Layers, color: '#F4D22B',
                title: 'Xây dựng sản phẩm AI',
                desc: 'Tích hợp Anthropic API vào app của bạn. Cùng endpoint, cùng SDK — chỉ cần đổi API key là chạy ngay với chi phí thấp hơn nhiều.',
                tags: ['API', 'SaaS', 'Product'],
              },
            ].map(({ icon: Icon, color, title, desc, tags }) => (
              <div key={title}
                className="group bg-[#0B1F3A] border border-[#14485F] hover:border-[#1485FF]/50 rounded-2xl p-7 transition-all hover:bg-[#0D2540]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all"
                  style={{ background: `${color}15` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="font-bold text-[#EEF4FF] mb-3 text-lg">{title}</h3>
                <p className="text-sm text-[#78A8B8] leading-relaxed mb-5">{desc}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <span key={t} className="text-xs bg-[#060D1A] border border-[#14485F] text-[#4D9AAA] px-2.5 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 border-t border-[#14485F]/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionTag><BadgeCheck className="w-3.5 h-3.5" /> Tại sao chọn cheapaikey.store?</SectionTag>
              <SectionHeading>Rẻ hơn. Dễ hơn.<br />Không cần Visa.</SectionHeading>
              <SectionSub>
                Mua trực tiếp từ Anthropic cần thẻ quốc tế, giá USD biến động, và không có hỗ trợ tiếng Việt.
                Chúng tôi giải quyết tất cả điều đó.
              </SectionSub>
            </div>

            {/* comparison table */}
            <div className="rounded-2xl overflow-hidden border border-[#14485F]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#060D1A]">
                    <th className="text-left px-5 py-4 text-[#4D7A8A] font-medium">Tiêu chí</th>
                    <th className="px-5 py-4 text-[#78E4E2] font-semibold text-center">cheapaikey.store</th>
                    <th className="px-5 py-4 text-[#4D7A8A] font-medium text-center">Anthropic trực tiếp</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Thanh toán', 'Ngân hàng VN', 'Visa/Mastercard'],
                    ['Ngôn ngữ hỗ trợ', 'Tiếng Việt', 'English only'],
                    ['Giá', 'Ưu đãi hơn ~5x', 'USD giá gốc'],
                    ['Kích hoạt', 'Tức thì (< 5s)', 'Ngay lập tức'],
                    ['Thanh toán theo tháng', '✓ Gói cố định', '✗ Pay-as-you-go'],
                    ['Hỗ trợ gia hạn tự động', '✓ Có', '✓ Có'],
                    ['Tương thích Claude Code', '✓ 100%', '✓ 100%'],
                  ].map(([criteria, us, them], i) => (
                    <tr key={criteria} className={i % 2 === 0 ? 'bg-[#0B1F3A]' : 'bg-[#0D2540]'}>
                      <td className="px-5 py-3.5 text-[#8BA8B8]">{criteria}</td>
                      <td className="px-5 py-3.5 text-center text-[#78E4E2] font-medium">{us}</td>
                      <td className="px-5 py-3.5 text-center text-[#4D7A8A]">{them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Zap,    color: '#F4D22B', title: 'Kích hoạt tức thì',    desc: 'Nhận key ngay sau thanh toán, hệ thống tự động — không cần chờ duyệt thủ công' },
            { icon: Shield, color: '#78E4E2', title: 'Key riêng tư tuyệt đối', desc: 'Mỗi người dùng một key độc lập, mã hoá, chỉ bạn thấy được trong dashboard' },
            { icon: Clock,  color: '#1485FF', title: 'Thanh toán nội địa',    desc: 'Chuyển khoản Vietcombank, Techcombank, MB... — không cần thẻ nước ngoài' },
            { icon: Globe,  color: '#78E4E2', title: 'Hỗ trợ mọi app',       desc: 'Claude Code, Cursor, Continue, OpenRouter, API trực tiếp — dùng được ở bất kỳ đâu' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-[#0B1F3A] border border-[#14485F] hover:border-[#1485FF]/40 rounded-xl p-6 transition-all">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-[#EEF4FF] mb-2">{title}</h3>
              <p className="text-sm text-[#78A8B8] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6 border-t border-[#14485F]/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionTag><Rocket className="w-3.5 h-3.5" /> Bắt đầu cực nhanh</SectionTag>
            <SectionHeading>Từ đăng ký đến dùng Claude — 5 phút</SectionHeading>
            <SectionSub>Không cần cấu hình phức tạp. Không cần thẻ quốc tế.</SectionSub>
          </div>

          <div className="grid sm:grid-cols-4 gap-6 relative">
            <div className="hidden sm:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#1485FF]/30 to-transparent" />
            {[
              { step: '01', icon: Users,    color: '#1485FF', title: 'Tạo tài khoản',        desc: 'Đăng ký miễn phí bằng email. Không cần thẻ, không cần điền nhiều thông tin.' },
              { step: '02', icon: Cpu,      color: '#78E4E2', title: 'Chọn gói phù hợp',     desc: 'Xem bảng giá, chọn gói phù hợp với nhu cầu. Mua gói 30 ngày hoặc lâu hơn.' },
              { step: '03', icon: Clock,    color: '#F4D22B', title: 'Chuyển khoản',          desc: 'Chuyển khoản ngân hàng nội địa theo mã giao dịch. Hệ thống tự xác nhận.' },
              { step: '04', icon: Terminal, color: '#1485FF', title: 'Copy Key & dùng ngay', desc: 'Nhận key trong dashboard, set ANTHROPIC_API_KEY và bắt đầu ngay lập tức.' },
            ].map(({ step, icon: Icon, color, title, desc }) => (
              <div key={step} className="flex flex-col items-center gap-3 relative z-10 text-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center border border-[#14485F] bg-[#0B1F3A] relative"
                  style={{ boxShadow: `0 0 30px ${color}18` }}>
                  <Icon className="w-8 h-8" style={{ color }} />
                  <span className="absolute -top-2.5 -right-2.5 text-[10px] font-mono bg-[#060D1A] border border-[#14485F] text-[#4D7A8A] px-1.5 py-0.5 rounded-full">
                    {step}
                  </span>
                </div>
                <h3 className="font-bold text-[#EEF4FF] text-base">{title}</h3>
                <p className="text-sm text-[#78A8B8] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* code snippet */}
          <div className="mt-16 bg-[#060D1A] border border-[#14485F] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#14485F] bg-[#0B1F3A]">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <span className="text-xs text-[#4D7A8A] ml-2 font-mono">Terminal — Tích hợp Claude Code</span>
            </div>
            <pre className="px-6 py-5 text-sm font-mono leading-7 overflow-x-auto">
              <code>
                <span className="text-[#4D7A8A]"># 1. Export API key từ cheapaikey.store</span>{'\n'}
                <span className="text-[#78E4E2]">export</span>{' '}
                <span className="text-[#EEF4FF]">ANTHROPIC_API_KEY</span>
                <span className="text-[#78A8B8]">=</span>
                <span className="text-[#F4D22B]">"sk-ant-xxxxxxxx..."</span>{'\n\n'}
                <span className="text-[#4D7A8A]"># 2. Chạy Claude Code như bình thường</span>{'\n'}
                <span className="text-[#1485FF]">claude</span>
                <span className="text-[#EEF4FF]"> "Giúp tôi refactor file này"</span>{'\n\n'}
                <span className="text-[#4D7A8A]"># 3. Hoặc dùng Anthropic SDK trong code</span>{'\n'}
                <span className="text-[#78E4E2]">from</span>
                <span className="text-[#EEF4FF]"> anthropic </span>
                <span className="text-[#78E4E2]">import</span>
                <span className="text-[#EEF4FF]"> Anthropic</span>{'\n'}
                <span className="text-[#EEF4FF]">client </span>
                <span className="text-[#78A8B8]">=</span>
                <span className="text-[#EEF4FF]"> Anthropic()  </span>
                <span className="text-[#4D7A8A]"># tự đọc ANTHROPIC_API_KEY</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 border-t border-[#14485F]/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionTag><Star className="w-3.5 h-3.5" /> Bảng giá</SectionTag>
            <SectionHeading>Giá minh bạch, không phát sinh</SectionHeading>
            <SectionSub>Chọn gói phù hợp, thanh toán một lần. Gia hạn bất cứ lúc nào.</SectionSub>
          </div>

          {plans.length === 0 ? (
            <p className="text-center text-[#4D7A8A] py-12">Đang tải gói dịch vụ...</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {plans.map((plan: any, i: number) => {
                const isPopular = plans.length > 1 && i === Math.floor(plans.length / 2);
                return (
                  <div key={plan.id}
                    className={`relative flex flex-col rounded-2xl p-8 border w-full max-w-sm transition-all ${
                      isPopular
                        ? 'bg-gradient-to-b from-[#0D2B50] to-[#0B1F3A] border-[#1485FF] shadow-[0_0_60px_#1485FF15]'
                        : 'bg-[#0B1F3A] border-[#14485F] hover:border-[#1485FF]/40'
                    }`}>
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#1485FF] to-[#0B6FD4] text-white text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                        ⭐ Phổ biến nhất
                      </div>
                    )}

                    <div className="mb-2">
                      <span className="text-sm font-semibold text-[#78E4E2] uppercase tracking-wider">{plan.name}</span>
                    </div>

                    <div className="flex items-end gap-1 mt-2 mb-1">
                      <span className="text-5xl font-bold text-[#EEF4FF]">{fmtPrice(plan.price)}</span>
                    </div>
                    <p className="text-sm text-[#78A8B8] mb-2">/ {plan.durationDays} ngày</p>

                    {/* quota highlight */}
                    <div className="bg-[#060D1A] border border-[#14485F] rounded-xl px-4 py-3 mb-6 text-center">
                      <span className="text-2xl font-bold text-[#F4D22B]">{fmtTokens(plan.tokenQuota)}</span>
                      <span className="text-sm text-[#78A8B8] ml-1">tokens</span>
                    </div>

                    <ul className="flex flex-col gap-3 mb-8">
                      {[
                        `${fmtTokens(plan.tokenQuota)} token quota`,
                        `${plan.durationDays} ngày hiệu lực`,
                        'Kích hoạt tức thì (< 5s)',
                        'Tích hợp Claude Code / Cursor',
                        'Gia hạn — quota cộng dồn',
                        'Dashboard quản lý đầy đủ',
                      ].map(feat => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm text-[#8BA8B8]">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#78E4E2] mt-0.5" />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <Link href="/register"
                      className={`mt-auto flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-semibold text-sm transition-colors ${
                        isPopular
                          ? 'bg-[#1485FF] hover:bg-[#0B6FD4] text-white shadow-[0_0_24px_#1485FF30]'
                          : 'bg-[#0D2540] hover:bg-[#142A4A] border border-[#14485F] hover:border-[#1485FF]/60 text-[#EEF4FF]'
                      }`}>
                      Mua ngay <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-sm text-[#4D7A8A] mt-8">
            Cần số lượng lớn hoặc gói doanh nghiệp? <Link href="/login" className="text-[#78E4E2] hover:underline">Liên hệ chúng tôi</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 border-t border-[#14485F]/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <SectionTag><MessageSquare className="w-3.5 h-3.5" /> Câu hỏi thường gặp</SectionTag>
            <SectionHeading>Giải đáp thắc mắc</SectionHeading>
          </div>

          <div className="flex flex-col gap-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-[#0B1F3A] border border-[#14485F] rounded-xl p-6">
                <h3 className="font-semibold text-[#EEF4FF] mb-3 flex items-start gap-3">
                  <span className="text-[#1485FF] shrink-0 mt-0.5">Q.</span>
                  {q}
                </h3>
                <p className="text-sm text-[#78A8B8] leading-relaxed pl-6">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-[#14485F]/40 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#1485FF]/8 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-5 leading-tight">
            Dùng Claude AI ngay hôm nay<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1485FF] to-[#78E4E2]">
              với giá tốt nhất Việt Nam
            </span>
          </h2>
          <p className="text-[#78A8B8] mb-10 text-lg">
            Đăng ký miễn phí · Kích hoạt trong 5 phút · Thanh toán nội địa
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#1485FF] hover:bg-[#0B6FD4] text-white px-10 py-4 rounded-xl font-semibold text-base transition-colors shadow-[0_0_40px_#1485FF30]">
              Tạo tài khoản miễn phí <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2 bg-[#0B1F3A] border border-[#14485F] hover:border-[#1485FF]/60 text-[#EEF4FF] px-8 py-4 rounded-xl font-semibold text-base transition-colors">
              Đã có tài khoản
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#14485F]/40 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <img src="/banner.png" alt="cheapaikey.store" className="h-7 w-auto" />
          <div className="flex gap-6 text-sm text-[#4D7A8A]">
            <a href="#features" className="hover:text-[#78A8B8] transition-colors">Tính năng</a>
            <a href="#pricing" className="hover:text-[#78A8B8] transition-colors">Bảng giá</a>
            <a href="#faq" className="hover:text-[#78A8B8] transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-[#78A8B8] transition-colors">Đăng nhập</Link>
          </div>
          <p className="text-sm text-[#4D7A8A]">© 2025 cheapaikey.store</p>
        </div>
      </footer>
    </div>
  );
}

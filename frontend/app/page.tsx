import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import {
  ArrowRight, CheckCircle2, BadgeCheck, Key,
  Code2, MessageSquare, Brain, Terminal,
  Star, Rocket, Users, Zap, Shield, Globe, Clock, Layers,
  TrendingUp, BookOpen, Cpu, ChevronDown,
} from 'lucide-react';
import RefHandler from '@/components/ref-handler';
import { ThemeToggle } from '@/components/theme-toggle';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:2053';

interface Plan {
  id: string;
  name: string;
  price: number;
  tokenQuota: number;
  durationDays: number;
}

async function getPlans(): Promise<Plan[]> {
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

export default async function LandingPage() {
  const plans = await getPlans();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-blink { animation: blink 1.1s step-end infinite; }
        .animate-fade-up { animation: fadeUp 0.7s ease-out both; }
        .animate-fade-up-1 { animation: fadeUp 0.7s 0.1s ease-out both; }
        .animate-fade-up-2 { animation: fadeUp 0.7s 0.2s ease-out both; }
        .animate-fade-up-3 { animation: fadeUp 0.7s 0.35s ease-out both; }
        .animate-fade-up-4 { animation: fadeUp 0.7s 0.5s ease-out both; }
        .text-shimmer {
          background: linear-gradient(90deg, #1485FF 0%, #78E4E2 40%, #1485FF 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        details > summary { list-style: none; cursor: pointer; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] .faq-chevron { transform: rotate(180deg); }
        .faq-chevron { transition: transform 0.25s ease; }
        .grid-bg {
          background-image: radial-gradient(rgba(120,228,226,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      <Suspense><RefHandler /></Suspense>

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50
        bg-background/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.png" alt="cheapaikey.store" width={120} height={32} className="h-7 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm">
            {[
              { href: '#features', label: 'Tính năng' },
              { href: '#how', label: 'Cách dùng' },
              { href: '#pricing', label: 'Bảng giá' },
              { href: '#faq', label: 'FAQ' },
            ].map(({ href, label }) => (
              <a key={href} href={href}
                className="px-3.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Link href="/login"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-all">
              Đăng nhập
            </Link>
            <Link href="/register"
              className="text-sm bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-all
                dark:shadow-[0_0_16px_rgba(255,107,0,0.4)] hover:dark:shadow-[0_0_24px_rgba(255,107,0,0.6)]">
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-5 overflow-hidden">
        {/* bg effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* dark: dot grid */}
          <div className="dark:block hidden absolute inset-0 grid-bg opacity-100" />
          {/* dark: glow orbs */}
          <div className="dark:block hidden absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]
            bg-[radial-gradient(ellipse_at_center,_rgba(255,107,0,0.12)_0%,_transparent_70%)]" />
          <div className="dark:block hidden absolute -bottom-20 right-0 w-[500px] h-[400px]
            bg-[radial-gradient(ellipse_at_center,_rgba(120,228,226,0.06)_0%,_transparent_70%)]" />
          {/* light: subtle mesh */}
          <div className="dark:hidden block absolute inset-0
            bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,107,0,0.08),transparent)]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left */}
            <div className="flex flex-col gap-6">
              <div className="animate-fade-up inline-flex self-start items-center gap-2
                bg-primary/8 dark:bg-primary/10 border border-primary/20
                rounded-full px-4 py-1.5 text-sm text-primary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#78E4E2] animate-pulse" />
                API Key Claude chính hãng · Thanh toán nội địa Việt Nam
              </div>

              <div className="animate-fade-up-1">
                <h1 className="text-5xl sm:text-6xl lg:text-[4rem] xl:text-[4.5rem] font-bold
                  tracking-tight leading-[1.08] text-foreground">
                  Dùng{' '}
                  <span className="text-shimmer">Claude AI</span>
                  <br />không giới hạn
                </h1>
              </div>

              <p className="animate-fade-up-2 text-lg text-muted-foreground leading-relaxed max-w-lg">
                API Key Claude giá rẻ, kích hoạt tức thì, thanh toán qua ngân hàng Việt Nam.
                Tương thích{' '}
                <strong className="text-foreground font-semibold">100%</strong>
                {' '}với Claude Code, Cursor và mọi tool AI.
              </p>

              <div className="animate-fade-up-3 flex flex-col sm:flex-row gap-3">
                <Link href="/register"
                  className="group inline-flex items-center justify-center gap-2
                    bg-primary hover:bg-primary/90 text-white px-7 py-3.5 rounded-xl
                    font-semibold text-base transition-all
                    dark:shadow-[0_0_30px_rgba(255,107,0,0.45)]
                    hover:dark:shadow-[0_0_40px_rgba(255,107,0,0.65)]
                    hover:-translate-y-0.5">
                  Bắt đầu miễn phí
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a href="#pricing"
                  className="inline-flex items-center justify-center gap-2
                    border border-border hover:border-primary/40 hover:bg-muted/50
                    text-foreground px-7 py-3.5 rounded-xl font-semibold text-base
                    transition-all hover:-translate-y-0.5">
                  Xem bảng giá <ChevronDown className="w-4 h-4" />
                </a>
              </div>

              {/* stats */}
              <div className="animate-fade-up-4 grid grid-cols-3 gap-3 pt-2">
                {[
                  { val: '5×', label: 'rẻ hơn mua trực tiếp', color: '#1485FF' },
                  { val: '<5s', label: 'kích hoạt key', color: '#78E4E2' },
                  { val: '24/7', label: 'hoạt động liên tục', color: '#F4D22B' },
                ].map(({ val, label, color }) => (
                  <div key={label}
                    className="relative rounded-xl border border-border/70 bg-card/60 px-3 py-4
                      dark:hover:border-primary/30 transition-colors text-center overflow-hidden">
                    <p className="text-2xl font-bold tabular-nums" style={{ color }}>{val}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — terminal card */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="animate-float w-full max-w-[480px]
                rounded-2xl border border-border overflow-hidden
                dark:shadow-[0_0_60px_rgba(255,107,0,0.15),0_0_120px_rgba(255,107,0,0.06)]
                shadow-[0_8px_60px_rgba(0,0,0,0.12)]
                bg-[#F6F8FA] dark:bg-[#0D1117]">
                {/* window chrome */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#EAEEF2] dark:bg-[#161B22]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF5F57] hover:opacity-80" />
                    <span className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:opacity-80" />
                    <span className="w-3 h-3 rounded-full bg-[#28C840] hover:opacity-80" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">terminal — Claude Code setup</span>
                  <div className="w-16" />
                </div>

                {/* code body */}
                <div className="px-5 py-5 font-mono text-[13px] leading-7 space-y-1">
                  <div>
                    <span className="text-muted-foreground"># 1. Set API key từ cheapaikey.store</span>
                  </div>
                  <div>
                    <span className="text-[#0969DA] dark:text-[#79C0FF]">export </span>
                    <span className="text-foreground">ANTHROPIC_API_KEY</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-[#0A3069] dark:text-[#A5D6FF]">&quot;sk-ant-api03-...&quot;</span>
                  </div>
                  <div className="h-3" />
                  <div>
                    <span className="text-muted-foreground"># 2. Chạy Claude Code như bình thường</span>
                  </div>
                  <div>
                    <span className="text-[#116329] dark:text-[#56D364]">$ </span>
                    <span className="text-[#0969DA] dark:text-[#79C0FF]">claude </span>
                    <span className="text-[#0A3069] dark:text-[#A5D6FF]">&quot;Giúp tôi refactor file này&quot;</span>
                  </div>
                  <div className="h-1" />
                  <div className="flex items-center gap-2">
                    <span className="text-[#116329] dark:text-[#56D364]">✓</span>
                    <span className="text-muted-foreground text-xs">Claude claude-sonnet-4-5 ready</span>
                    <span className="text-[#116329] dark:text-[#56D364] text-xs ml-1">● connected</span>
                  </div>
                  <div className="h-3" />
                  <div>
                    <span className="text-muted-foreground"># 3. Hoặc dùng với Python SDK</span>
                  </div>
                  <div>
                    <span className="text-[#CF222E] dark:text-[#FF7B72]">from </span>
                    <span className="text-foreground">anthropic </span>
                    <span className="text-[#CF222E] dark:text-[#FF7B72]">import </span>
                    <span className="text-foreground">Anthropic</span>
                  </div>
                  <div>
                    <span className="text-foreground">client </span>
                    <span className="text-muted-foreground">= </span>
                    <span className="text-[#0969DA] dark:text-[#79C0FF]">Anthropic</span>
                    <span className="text-muted-foreground">()</span>
                    <span className="animate-blink text-[#FF6B00] ml-0.5">▋</span>
                  </div>
                </div>

                {/* bottom status bar */}
                <div className="px-5 py-3 bg-[#EAEEF2] dark:bg-[#161B22] border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-[#116329] dark:text-[#56D364]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#116329] dark:bg-[#56D364]" />
                      API connected
                    </span>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="text-muted-foreground">model: claude-sonnet-4-5</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">9Router proxy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────────────── */}
      <div className="border-y border-border/40 py-5 px-5 bg-muted/30">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <span className="text-sm text-muted-foreground">Tương thích với</span>
          {['Claude Code', 'Cursor', 'Continue.dev', 'Anthropic SDK', 'OpenRouter'].map(tool => (
            <span key={tool}
              className="text-sm font-medium text-foreground/70 hover:text-foreground
                border border-border/60 rounded-full px-3 py-1 transition-colors
                dark:hover:border-primary/40 hover:border-primary/40">
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features bento ───────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20
              rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-5">
              <BadgeCheck className="w-3.5 h-3.5" /> Tại sao chọn cheapaikey.store?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Rẻ hơn. Dễ hơn. Không cần Visa.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Tất cả những gì bạn cần để dùng Claude AI — không rào cản, không phức tạp.
            </p>
          </div>

          {/* bento grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* big card */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border
              bg-card p-8 group hover:border-primary/40 transition-all">
              <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none
                dark:bg-[radial-gradient(ellipse_at_top_right,rgba(255,107,0,0.08),transparent)]" />
              <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center
                justify-center mb-6 dark:shadow-[0_0_20px_rgba(255,107,0,0.2)]">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Kích hoạt tức thì</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chuyển khoản xong → hệ thống tự động xác nhận → key xuất hiện trong dashboard.
                Không cần chờ duyệt thủ công, không cần gửi email. Mọi thứ xảy ra trong <strong className="text-foreground">dưới 5 giây</strong>.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <Clock className="w-4 h-4" /> Trung bình 2.3 giây từ lúc thanh toán
              </div>
            </div>

            {/* regular card */}
            <div className="rounded-2xl border border-border bg-card p-7 group hover:border-primary/40
              transition-all hover:bg-muted/20">
              <div className="w-10 h-10 rounded-xl bg-[#78E4E2]/10 flex items-center justify-center mb-5
                dark:shadow-[0_0_16px_rgba(120,228,226,0.15)]">
                <Shield className="w-5 h-5 text-[#78E4E2]" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Key riêng của bạn</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Mỗi tài khoản được cấp một API Key riêng biệt. Chỉ bạn mới thấy và sử dụng được.
              </p>
            </div>

            {/* regular card */}
            <div className="rounded-2xl border border-border bg-card p-7 group hover:border-primary/40
              transition-all hover:bg-muted/20">
              <div className="w-10 h-10 rounded-xl bg-[#F4D22B]/10 flex items-center justify-center mb-5">
                <Globe className="w-5 h-5 text-[#F4D22B]" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Thanh toán nội địa</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vietcombank, Techcombank, MB, BIDV... — mọi ngân hàng Việt Nam. Không cần thẻ quốc tế.
              </p>
            </div>

            {/* big card bottom */}
            <div className="sm:col-span-2 relative overflow-hidden rounded-2xl border border-border
              bg-card p-8 group hover:border-primary/40 transition-all">
              <div className="absolute bottom-0 left-0 w-64 h-48 pointer-events-none
                dark:bg-[radial-gradient(ellipse_at_bottom_left,rgba(120,228,226,0.06),transparent)]" />
              <div className="w-12 h-12 rounded-2xl bg-[#78E4E2]/10 flex items-center
                justify-center mb-6 dark:shadow-[0_0_20px_rgba(120,228,226,0.15)]">
                <Code2 className="w-6 h-6 text-[#78E4E2]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Drop-in replacement cho Anthropic API</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Không cần thay đổi code. Cùng endpoint, cùng SDK, cùng model. Chỉ cần đổi API key là dùng
                được ngay với <strong className="text-foreground">Claude Code, Cursor, Continue</strong> và
                mọi app tích hợp Anthropic API.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Claude Code', 'Cursor', 'Continue.dev', 'Python SDK', 'TypeScript SDK', 'OpenRouter'].map(t => (
                  <span key={t}
                    className="text-xs border border-border bg-muted text-muted-foreground
                      px-2.5 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20
              rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-5">
              <Brain className="w-3.5 h-3.5" /> Bạn dùng Claude để làm gì?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Mọi tác vụ AI — một API Key</h2>
            <p className="text-muted-foreground text-lg">Từ lập trình đến viết lách, phân tích dữ liệu đến tự động hoá</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Code2, accent: '#1485FF',
                title: 'Lập trình với Claude Code',
                desc: 'Viết code, debug, review PR, refactor codebase toàn bộ dự án. Claude Code tích hợp terminal, hiểu context toàn bộ repo.',
                tags: ['Claude Code', 'Cursor', 'Continue'],
              },
              {
                icon: MessageSquare, accent: '#78E4E2',
                title: 'Chatbot & trợ lý AI',
                desc: 'Xây dựng chatbot thông minh cho website, app. Claude có khả năng hiểu ngữ cảnh dài, trả lời tự nhiên bằng tiếng Việt.',
                tags: ['Chatbot', 'Customer support', 'RAG'],
              },
              {
                icon: BookOpen, accent: '#F4D22B',
                title: 'Viết lách & sáng tạo nội dung',
                desc: 'Viết bài blog, email marketing, kịch bản video, mô tả sản phẩm. Tạo nội dung chuyên nghiệp hàng loạt với API.',
                tags: ['Content', 'Copywriting', 'SEO'],
              },
              {
                icon: TrendingUp, accent: '#1485FF',
                title: 'Phân tích dữ liệu & báo cáo',
                desc: 'Phân tích CSV, tóm tắt tài liệu dài, trích xuất thông tin từ văn bản không cấu trúc. Biến dữ liệu thô thành insight.',
                tags: ['Analytics', 'Summarization', 'Extraction'],
              },
              {
                icon: Terminal, accent: '#78E4E2',
                title: 'Tự động hoá công việc',
                desc: 'Kết hợp Claude với Python, n8n, Make để tự động hoá email, phân loại ticket, xử lý form — không cần lập trình viên.',
                tags: ['Automation', 'n8n', 'Python'],
              },
              {
                icon: Layers, accent: '#F4D22B',
                title: 'Xây dựng sản phẩm AI',
                desc: 'Tích hợp Anthropic API vào app của bạn. Cùng endpoint, cùng SDK — chỉ cần đổi API key là chạy ngay với chi phí thấp hơn.',
                tags: ['API', 'SaaS', 'Product'],
              },
            ].map(({ icon: Icon, accent, title, desc, tags }) => (
              <div key={title}
                className="group rounded-2xl border border-border bg-card p-6
                  hover:border-primary/40 hover:bg-muted/20 transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all"
                  style={{ background: `${accent}14` }}>
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <h3 className="font-bold text-foreground mb-2.5 text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <span key={t} className="text-xs bg-muted border border-border text-muted-foreground px-2.5 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-5 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20
              rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-5">
              <Rocket className="w-3.5 h-3.5" /> Bắt đầu cực nhanh
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Từ đăng ký đến dùng Claude — 5 phút
            </h2>
            <p className="text-muted-foreground text-lg">Không cần cấu hình phức tạp. Không cần thẻ quốc tế.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* connector line desktop */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px
              bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

            {[
              { step: '01', icon: Users,    accent: '#1485FF', title: 'Tạo tài khoản',         desc: 'Đăng ký miễn phí bằng email. Không cần thẻ, không cần nhiều thông tin.' },
              { step: '02', icon: Cpu,      accent: '#78E4E2', title: 'Chọn gói phù hợp',      desc: 'Xem bảng giá, chọn gói phù hợp với nhu cầu. Gói 30 ngày hoặc lâu hơn.' },
              { step: '03', icon: Clock,    accent: '#F4D22B', title: 'Chuyển khoản',           desc: 'Chuyển khoản ngân hàng nội địa theo mã giao dịch. Hệ thống tự xác nhận.' },
              { step: '04', icon: Terminal, accent: '#1485FF', title: 'Copy Key & dùng ngay',  desc: 'Nhận key trong dashboard, set ANTHROPIC_API_KEY và bắt đầu ngay lập tức.' },
            ].map(({ step, icon: Icon, accent, title, desc }) => (
              <div key={step} className="flex flex-col items-center gap-4 relative z-10 text-center">
                <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center
                  border border-border bg-card transition-all"
                  style={{ boxShadow: `0 0 24px ${accent}18` }}>
                  <Icon className="w-8 h-8" style={{ color: accent }} />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 flex items-center justify-center
                    bg-background border border-border rounded-full text-[10px] font-mono font-bold
                    text-muted-foreground">
                    {step.replace('0', '')}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* code card */}
          <div className="mt-16 rounded-2xl border border-border overflow-hidden
            dark:shadow-[0_0_40px_rgba(255,107,0,0.08)]">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/50">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </div>
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                Terminal — Tích hợp Claude Code
              </span>
            </div>
            <pre className="px-6 py-5 text-sm font-mono leading-7 overflow-x-auto bg-card">
              <code>
                <span className="text-muted-foreground"># 1. Export API key từ cheapaikey.store</span>{'\n'}
                <span className="text-[#78E4E2]">export</span>{' '}
                <span className="text-foreground">ANTHROPIC_API_KEY</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-[#F4D22B]">&quot;sk-ant-xxxxxxxx...&quot;</span>{'\n\n'}
                <span className="text-muted-foreground"># 2. Chạy Claude Code như bình thường</span>{'\n'}
                <span className="text-primary">claude</span>
                <span className="text-foreground"> &quot;Giúp tôi refactor file này&quot;</span>{'\n\n'}
                <span className="text-muted-foreground"># 3. Hoặc dùng Anthropic SDK trong code</span>{'\n'}
                <span className="text-[#78E4E2]">from</span>
                <span className="text-foreground"> anthropic </span>
                <span className="text-[#78E4E2]">import</span>
                <span className="text-foreground"> Anthropic</span>{'\n'}
                <span className="text-foreground">client </span>
                <span className="text-muted-foreground">=</span>
                <span className="text-foreground"> Anthropic()  </span>
                <span className="text-muted-foreground"># tự đọc ANTHROPIC_API_KEY</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Why us — comparison ──────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20
                rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6">
                <BadgeCheck className="w-3.5 h-3.5" /> So sánh
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-5 leading-tight">
                Rẻ hơn.<br />Dễ hơn.<br />Không cần Visa.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Mua trực tiếp từ Anthropic cần thẻ quốc tế, giá USD biến động, và không có
                hỗ trợ tiếng Việt. Chúng tôi giải quyết tất cả điều đó.
              </p>
              <Link href="/register"
                className="inline-flex items-center gap-2 mt-8 bg-primary hover:bg-primary/90
                  text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all
                  dark:shadow-[0_0_20px_rgba(255,107,0,0.35)]">
                Đăng ký ngay <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/70 border-b border-border">
                <div className="px-4 py-4 text-sm text-muted-foreground font-medium">Tiêu chí</div>
                <div className="px-4 py-4 text-sm text-primary font-semibold text-center border-x border-border
                  bg-primary/5 dark:bg-primary/8">
                  cheapaikey.store
                </div>
                <div className="px-4 py-4 text-sm text-muted-foreground font-medium text-center">
                  Anthropic trực tiếp
                </div>
              </div>
              {[
                ['Thanh toán',              'Ngân hàng VN', 'Visa/Mastercard'],
                ['Ngôn ngữ hỗ trợ',        'Tiếng Việt',   'English only'],
                ['Giá',                     'Ưu đãi ~5×',   'USD giá gốc'],
                ['Kích hoạt',               '< 5 giây',     'Ngay lập tức'],
                ['Gói cố định hàng tháng',  '✓ Có',         '✗ Pay-as-you-go'],
                ['Quota cộng dồn',          '✓ Có',         '✗ Không'],
                ['Tương thích Claude Code', '✓ 100%',       '✓ 100%'],
              ].map(([criteria, us, them], i) => (
                <div key={criteria}
                  className={`grid grid-cols-3 border-b border-border/50 last:border-b-0 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}>
                  <div className="px-4 py-3.5 text-sm text-muted-foreground">{criteria}</div>
                  <div className="px-4 py-3.5 text-sm text-primary font-medium text-center
                    border-x border-border bg-primary/4 dark:bg-primary/5">
                    {us}
                  </div>
                  <div className="px-4 py-3.5 text-sm text-muted-foreground/60 text-center">{them}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Authenticity ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#78E4E2]/8 border border-[#78E4E2]/20
              rounded-full px-4 py-1.5 text-sm text-[#78E4E2] font-medium mb-5">
              <BadgeCheck className="w-3.5 h-3.5" /> Cam kết chính hãng
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              100% API thật từ Anthropic<br />không phải model giả mạo
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Nhiều dịch vụ trên thị trường dùng model mã nguồn mở (Llama, Mistral...) rồi giả danh Claude.
              cheapaikey.store cam kết hoàn toàn khác.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* Flow diagram */}
            <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
              <h3 className="font-bold text-foreground text-base mb-6">Request của bạn đi qua đâu?</h3>
              {[
                { step: '1', accent: '#1485FF', label: 'Ứng dụng của bạn',      desc: 'Claude Code, Cursor, SDK... gửi request với API Key' },
                { step: '2', accent: '#78E4E2', label: 'cheapaikey.store proxy', desc: '9Router — chỉ xác thực key và chuyển tiếp, không đọc nội dung' },
                { step: '3', accent: '#F4D22B', label: 'Anthropic API',          desc: 'api.anthropic.com — server chính thức của Anthropic, Claude thật' },
              ].map(({ step, accent, label, desc }, i) => (
                <div key={step} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center
                      text-sm font-bold text-background"
                      style={{ background: accent }}>
                      {step}
                    </div>
                    {i < 2 && <div className="w-px h-8 bg-border" />}
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold text-foreground text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Guarantees */}
            <div className="space-y-3">
              {[
                { icon: '🔐', accent: '#1485FF', title: 'Kết nối thẳng Anthropic',    desc: 'Mọi request đều đến trực tiếp api.anthropic.com. 9Router chỉ là lớp proxy xác thực key — không thay đổi model hay nội dung phản hồi.' },
                { icon: '🧠', accent: '#78E4E2', title: 'Đúng model, đúng phiên bản', desc: 'Claude Opus 4, Sonnet 4, Haiku 4 — chính xác model bạn chỉ định. Không swap sang model rẻ hơn phía sau.' },
                { icon: '✅', accent: '#F4D22B', title: 'Tự kiểm chứng được',          desc: 'Dùng Claude Code với key của chúng tôi rồi chạy /model — bạn sẽ thấy đúng model Anthropic, không phải model giả mạo nào.' },
                { icon: '🚫', accent: '#1485FF', title: 'Không log nội dung chat',     desc: 'Proxy chỉ đọc header xác thực. Nội dung conversation đi thẳng đến Anthropic, không bị lưu hay đọc trung gian.' },
              ].map(({ icon, title, desc }) => (
                <div key={title}
                  className="flex gap-4 bg-card border border-border
                    hover:border-primary/40 rounded-xl p-5 transition-all group">
                  <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1.5">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-2 bg-card border border-primary/30
              rounded-full px-5 py-2.5 text-sm">
              <BadgeCheck className="w-4 h-4 text-primary" />
              <span>Powered by <strong className="text-foreground">Anthropic API</strong> chính thức</span>
            </div>
            <div className="flex items-center gap-2 bg-card border border-[#78E4E2]/30
              rounded-full px-5 py-2.5 text-sm">
              <BadgeCheck className="w-4 h-4 text-[#78E4E2]" />
              <span>Proxy bởi <strong className="text-foreground">9Router</strong> — minh bạch</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-5 border-t border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none
          dark:bg-[radial-gradient(ellipse_70%_40%_at_50%_50%,rgba(255,107,0,0.05),transparent)]" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20
              rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-5">
              <Star className="w-3.5 h-3.5" /> Bảng giá
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Giá minh bạch, không phát sinh
            </h2>
            <p className="text-muted-foreground text-lg">Chọn gói phù hợp, thanh toán một lần. Gia hạn bất cứ lúc nào.</p>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-12 h-12 rounded-full border border-border flex items-center
                justify-center mx-auto mb-4 animate-pulse">
                <Key className="w-5 h-5" />
              </div>
              <p>Đang tải gói dịch vụ...</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-5">
              {plans.map((plan: Plan, i: number) => {
                const isPopular = plans.length > 1 && i === Math.floor(plans.length / 2);
                const tokenPct = Math.min(100, Math.round((plan.tokenQuota / 2_000_000) * 100));
                return (
                  <div key={plan.id}
                    className={`relative flex flex-col rounded-2xl w-full max-w-[320px]
                      border transition-all duration-300 ${
                      isPopular
                        ? 'border-primary bg-card dark:shadow-[0_0_40px_rgba(255,107,0,0.25),0_0_80px_rgba(255,107,0,0.1)] -translate-y-2'
                        : 'border-border bg-card hover:border-primary/40 hover:-translate-y-1'
                    }`}>

                    {isPopular && (
                      <div className="absolute -top-px inset-x-0 h-[2px] rounded-t-2xl
                        bg-gradient-to-r from-[#FF6B00] via-[#78E4E2] to-[#FF6B00]" />
                    )}
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1.5
                          bg-gradient-to-r from-[#FF6B00] to-[#78E4E2]
                          text-white text-xs font-bold px-4 py-1.5 rounded-full
                          shadow-[0_4px_16px_rgba(255,107,0,0.4)]">
                          <Star className="w-3 h-3 fill-white" /> Phổ biến nhất
                        </span>
                      </div>
                    )}

                    <div className="p-8 pb-0">
                      <div className="mb-1">
                        <span className={`text-xs font-bold uppercase tracking-widest ${
                          isPopular ? 'text-primary' : 'text-muted-foreground'
                        }`}>{plan.name}</span>
                      </div>

                      <div className="flex items-end gap-1 mt-3">
                        <span className="text-4xl font-bold text-foreground tracking-tight">
                          {fmtPrice(plan.price)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 mb-6">/ {plan.durationDays} ngày</p>

                      {/* token highlight */}
                      <div className={`rounded-xl px-5 py-4 mb-6 ${
                        isPopular ? 'bg-primary/8 border border-primary/20' : 'bg-muted border border-border'
                      }`}>
                        <div className="flex items-end justify-between mb-2">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                            Token quota
                          </span>
                          <span className="text-xs text-muted-foreground">{tokenPct}% of 2M</span>
                        </div>
                        <p className="text-2xl font-bold text-[#F4D22B] mb-2">{fmtTokens(plan.tokenQuota)}</p>
                        <div className="h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#78E4E2]"
                            style={{ width: `${tokenPct}%` }} />
                        </div>
                      </div>

                      <ul className="flex flex-col gap-2.5 mb-8">
                        {[
                          `${fmtTokens(plan.tokenQuota)} token quota`,
                          `${plan.durationDays} ngày hiệu lực`,
                          'Kích hoạt tức thì (< 5s)',
                          'Tích hợp Claude Code / Cursor',
                          'Quota cộng dồn khi gia hạn',
                          'Dashboard quản lý đầy đủ',
                        ].map(feat => (
                          <li key={feat} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#78E4E2] mt-0.5" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-8 pt-0 mt-auto">
                      <Link href="/register"
                        className={`flex items-center justify-center gap-2 py-3.5 rounded-xl
                          font-semibold text-sm transition-all ${
                          isPopular
                            ? 'bg-primary hover:bg-primary/90 text-white dark:shadow-[0_0_20px_rgba(255,107,0,0.35)]'
                            : 'bg-muted hover:bg-muted/70 border border-border hover:border-primary/50 text-foreground'
                        }`}>
                        Mua ngay <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-10">
            Cần số lượng lớn hoặc gói doanh nghiệp?{' '}
            <Link href="/login" className="text-primary hover:underline">Liên hệ chúng tôi</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-5 border-t border-border/40">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20
              rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-5">
              <MessageSquare className="w-3.5 h-3.5" /> FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Câu hỏi thường gặp</h2>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-1">
                <summary className="flex items-center justify-between gap-4 py-4 select-none">
                  <span className="font-medium text-foreground text-sm sm:text-base pr-2">{q}</span>
                  <span className="faq-chevron shrink-0 w-8 h-8 rounded-full bg-muted
                    flex items-center justify-center text-muted-foreground
                    group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </summary>
                <div className="pb-5 pt-1 text-sm text-muted-foreground leading-relaxed pl-0 pr-12">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-28 px-5 border-t border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="dark:block hidden absolute inset-0 grid-bg opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[700px] h-[400px]
            dark:bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.12),transparent)]
            bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.05),transparent)]" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20
            rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <Key className="w-3.5 h-3.5" /> Bắt đầu ngay hôm nay
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight text-foreground">
            Dùng Claude AI ngay hôm nay
            <br />
            <span className="text-shimmer">với giá tốt nhất Việt Nam</span>
          </h2>

          <p className="text-muted-foreground mb-10 text-lg">
            Đăng ký miễn phí · Kích hoạt trong 5 phút · Thanh toán nội địa
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="group inline-flex items-center justify-center gap-2
                bg-primary hover:bg-primary/90 text-white
                px-10 py-4 rounded-xl font-semibold text-base transition-all
                dark:shadow-[0_0_40px_rgba(255,107,0,0.45)]
                hover:dark:shadow-[0_0_50px_rgba(255,107,0,0.65)]
                hover:-translate-y-0.5">
              Tạo tài khoản miễn phí
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2
                border border-border hover:border-primary/40 hover:bg-muted/50
                text-foreground px-8 py-4 rounded-xl font-semibold text-base
                transition-all hover:-translate-y-0.5">
              Đã có tài khoản
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-5">
          <Image src="/logo.png" alt="cheapaikey.store" width={120} height={28} className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity" />

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Tính năng</a>
            <a href="#how" className="hover:text-foreground transition-colors">Cách dùng</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Bảng giá</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Đăng nhập</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Đăng ký</Link>
          </div>

          <p className="text-sm text-muted-foreground">© 2025 cheapaikey.store</p>
        </div>
      </footer>
    </div>
  );
}

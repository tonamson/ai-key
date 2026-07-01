import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import SupportButton from "@/components/support-button";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL('https://cheapaikey.store'),
  title: {
    default: "cheapaikey.store — Mua API Key Claude Giá Rẻ, Kích Hoạt Tức Thì",
    template: "%s | cheapaikey.store",
  },
  description: "Mua API Key Claude (Anthropic) giá rẻ nhất Việt Nam — từ 99.000đ/tháng. Không cần Visa/Mastercard, thanh toán chuyển khoản nội địa, kích hoạt tự động trong vài giây. Dùng ngay với Claude Code, Cursor, Continue.",
  keywords: [
    "mua api key claude",
    "api key claude giá rẻ",
    "claude api key việt nam",
    "mua key claude code",
    "api key ai giá rẻ",
    "claude api key thanh toán việt nam",
    "mua key ai không cần visa",
    "anthropic api key giá rẻ",
    "key claude code rẻ",
    "api key claude thanh toán ngân hàng",
    "cheapaikey",
    "mua key ai việt nam",
    "api key claude không cần thẻ",
    "claude api key kích hoạt ngay",
    "mua anthropic api key",
    "api key cho cursor ai",
    "claude code api key việt nam",
    "api key ai thanh toán nội địa",
  ],
  openGraph: {
    title: "cheapaikey.store — Mua API Key Claude Giá Rẻ, Kích Hoạt Tức Thì",
    description: "API Key Claude giá rẻ nhất Việt Nam — từ 99.000đ/tháng. Không cần Visa, thanh toán chuyển khoản, kích hoạt tự động. Dùng với Claude Code, Cursor và mọi tool AI.",
    url: "https://cheapaikey.store",
    siteName: "cheapaikey.store",
    images: [{ url: "/intro.png", width: 1200, height: 630, alt: "cheapaikey.store — Mua API Key Claude Giá Rẻ Nhất Việt Nam" }],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "cheapaikey.store — Mua API Key Claude Giá Rẻ",
    description: "API Key Claude giá rẻ nhất Việt Nam. Không cần Visa, thanh toán chuyển khoản nội địa, kích hoạt tức thì.",
    images: ["/intro.png"],
  },
  alternates: {
    canonical: "https://cheapaikey.store",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://cheapaikey.store/#website",
      "url": "https://cheapaikey.store",
      "name": "cheapaikey.store",
      "description": "Mua API Key Claude giá rẻ nhất Việt Nam",
      "inLanguage": "vi",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://cheapaikey.store/?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://cheapaikey.store/#organization",
      "name": "cheapaikey.store",
      "url": "https://cheapaikey.store",
      "logo": { "@type": "ImageObject", "url": "https://cheapaikey.store/intro.png", "width": 1200, "height": 630 },
      "description": "Cung cấp API Key Claude (Anthropic) giá rẻ tại Việt Nam với thanh toán nội địa, kích hoạt tức thì.",
      "areaServed": "VN",
      "availableLanguage": "Vietnamese",
      "contactPoint": { "@type": "ContactPoint", "contactType": "customer service", "availableLanguage": "Vietnamese" },
    },
    {
      "@type": "WebPage",
      "@id": "https://cheapaikey.store/#webpage",
      "url": "https://cheapaikey.store",
      "name": "Mua API Key Claude Giá Rẻ — cheapaikey.store",
      "isPartOf": { "@id": "https://cheapaikey.store/#website" },
      "publisher": { "@id": "https://cheapaikey.store/#organization" },
      "description": "Mua API Key Claude giá rẻ nhất Việt Nam. Thanh toán nội địa, kích hoạt tự động, dùng ngay với Claude Code và Cursor.",
      "inLanguage": "vi",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": "https://cheapaikey.store" }],
      },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "cheapaikey.store là gì?", "acceptedAnswer": { "@type": "Answer", "text": "Chúng tôi cung cấp API Key Claude (Anthropic) dạng gói tháng với giá phải chăng, thanh toán bằng chuyển khoản nội địa Việt Nam." } },
        { "@type": "Question", "name": "Tôi có cần thẻ Visa/Mastercard không?", "acceptedAnswer": { "@type": "Answer", "text": "Không. Chúng tôi chấp nhận chuyển khoản ngân hàng nội địa (Vietcombank, Techcombank, MB...). Hệ thống xác nhận tự động sau khi nhận được tiền." } },
        { "@type": "Question", "name": "API Key hoạt động với Claude Code không?", "acceptedAnswer": { "@type": "Answer", "text": "Có, hoạt động 100%. Chỉ cần đặt ANTHROPIC_API_KEY=<key của bạn> là dùng được ngay với Claude Code, Cursor, Continue và mọi tool hỗ trợ Anthropic API." } },
        { "@type": "Question", "name": "Mua xong bao lâu nhận được key?", "acceptedAnswer": { "@type": "Answer", "text": "Ngay lập tức. Hệ thống tự động xác nhận thanh toán và kích hoạt key trong vài giây." } },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`} suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-screen bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <SupportButton />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Script src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`} strategy="lazyOnload" />
      </body>
    </html>
  );
}

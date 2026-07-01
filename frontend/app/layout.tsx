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
  title: "cheapaikey.store — Mua API Key Claude Giá Rẻ, Kích Hoạt Tức Thì",
  description: "Mua API Key Claude giá rẻ nhất Việt Nam. Thanh toán chuyển khoản ngân hàng nội địa, nhận key ngay lập tức. Dùng được với Claude Code, Cursor, và mọi ứng dụng AI.",
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
  ],
  openGraph: {
    title: "cheapaikey.store — Mua API Key Claude Giá Rẻ",
    description: "API Key Claude giá rẻ nhất Việt Nam. Thanh toán chuyển khoản nội địa, kích hoạt ngay, dùng được với Claude Code và Cursor.",
    url: "https://cheapaikey.store",
    siteName: "cheapaikey.store",
    images: [{ url: "/intro.png", width: 1200, height: 630, alt: "cheapaikey.store — Mua API Key Claude Giá Rẻ" }],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "cheapaikey.store — Mua API Key Claude Giá Rẻ",
    description: "API Key Claude giá rẻ nhất Việt Nam. Thanh toán chuyển khoản nội địa, kích hoạt ngay.",
    images: ["/intro.png"],
  },
  alternates: {
    canonical: "https://cheapaikey.store",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`} suppressHydrationWarning>
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

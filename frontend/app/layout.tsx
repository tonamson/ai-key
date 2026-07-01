import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import SupportButton from "@/components/support-button";
import "./globals.css";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL('https://cheapaikey.store'),
  title: "cheapaikey.store — Affordable AI API Keys",
  description: "Mua API Key Claude giá rẻ, thanh toán ngân hàng Việt Nam, kích hoạt tức thì. Tương thích Claude Code, Cursor và mọi app AI.",
  openGraph: {
    title: "cheapaikey.store — Affordable AI API Keys",
    description: "Mua API Key Claude giá rẻ, thanh toán ngân hàng Việt Nam, kích hoạt tức thì.",
    url: "https://cheapaikey.store",
    siteName: "cheapaikey.store",
    images: [{ url: "/intro.png", width: 1200, height: 630, alt: "cheapaikey.store" }],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "cheapaikey.store — Affordable AI API Keys",
    description: "Mua API Key Claude giá rẻ, thanh toán ngân hàng Việt Nam, kích hoạt tức thì.",
    images: ["/intro.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased dark`}>
      <body className="min-h-screen bg-background">
        {children}
        <SupportButton />
        <Toaster richColors position="top-right" />
        <Script src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`} strategy="lazyOnload" />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteChrome } from "@/components/layout/site-chrome";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "MultiFlora Garden",
  title: {
    default: "MultiFlora Garden — Питомник растений и ландшафтный дизайн",
    template: "%s | MultiFlora Garden",
  },
  description:
    "Питомник растений MultiFlora Garden: каталог комнатных и садовых растений, ландшафтный дизайн, уход за садом. Доставка по Москве и области.",
  keywords: ["растения", "питомник", "ландшафтный дизайн", "сад", "MultiFlora Garden"],
  icons: {
    icon: [
      { url: "/multiflora-logo.png", type: "image/png", sizes: "512x512" },
      { url: "/multiflora-logo.svg", type: "image/svg+xml" },
    ],
    apple: "/multiflora-logo.png",
    shortcut: "/multiflora-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "MultiFlora Garden",
    images: [
      { url: "/multiflora-logo.png", width: 512, height: 512, alt: "MultiFlora Garden" },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <SiteJsonLd />
        <AuthSessionProvider>
          <SiteChrome>{children}</SiteChrome>
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}

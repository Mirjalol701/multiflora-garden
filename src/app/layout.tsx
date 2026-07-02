import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteChrome } from "@/components/layout/site-chrome";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { siteConfig, titleTemplate } from "@/config/site";
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
  applicationName: siteConfig.brand.name,
  title: {
    default: siteConfig.seo.titleDefault,
    template: titleTemplate(),
  },
  description: siteConfig.seo.description,
  keywords: [...siteConfig.seo.keywords],
  icons: {
    icon: [
      { url: siteConfig.brand.logo, type: "image/png", sizes: "512x512" },
      { url: siteConfig.brand.logoFallback, type: "image/svg+xml" },
    ],
    apple: siteConfig.brand.logo,
    shortcut: siteConfig.brand.logo,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale.ogLocale,
    siteName: siteConfig.brand.name,
    images: [
      {
        url: siteConfig.brand.logo,
        width: 512,
        height: 512,
        alt: siteConfig.brand.name,
      },
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
    <html lang={siteConfig.locale.lang.split("-")[0]}>
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

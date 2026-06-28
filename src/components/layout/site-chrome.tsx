"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAiLanding = pathname === "/" || pathname?.startsWith("/ai") || pathname?.startsWith("/a/");
  const isAuthPage = pathname === "/login";
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAiLanding || isAuthPage || isAdminPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
    </>
  );
}

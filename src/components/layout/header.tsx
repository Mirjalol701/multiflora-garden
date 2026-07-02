"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const navLinks = siteConfig.nav;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-100/80 bg-white/90 backdrop-blur-md transition-shadow duration-300 supports-[backdrop-filter]:bg-white/75">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:h-[4.5rem]">
        <Link
          href="/garden"
          className="group flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 transition-colors duration-300 group-hover:bg-emerald-100">
            <Leaf className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-emerald-800 lg:text-lg">
              {siteConfig.brand.name}
            </span>
            <span className="hidden text-[11px] font-medium text-stone-500 sm:block">
              {siteConfig.brand.tagline}
            </span>
          </div>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Основная навигация"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-stone-600 hover:bg-emerald-50/60 hover:text-emerald-800"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu className="hidden sm:flex" />
          <Button
            asChild
            size="sm"
            className="hidden bg-emerald-800 shadow-sm transition-colors duration-200 hover:bg-emerald-900 sm:inline-flex"
          >
            <Link href="/contacts">
              <Phone className="h-4 w-4" />
              {siteConfig.ui.consultation}
            </Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

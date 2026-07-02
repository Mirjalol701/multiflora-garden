"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const navLinks = siteConfig.nav;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-emerald-950/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <nav
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(100vw-3rem,20rem)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Мобильная навигация"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
          <span className="font-semibold text-emerald-800">{siteConfig.ui.menu}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
            className="text-emerald-800 hover:bg-emerald-50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ul className="flex flex-1 flex-col gap-1 p-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block rounded-lg px-4 py-3 text-base font-medium transition-colors duration-200",
                    isActive
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-stone-600 hover:bg-emerald-50/70 hover:text-emerald-800"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-emerald-100 p-4 space-y-3">
          {!session?.user && (
            <Button asChild variant="outline" className="w-full border-emerald-200 text-emerald-800">
              <Link href="/login">{siteConfig.ui.signIn}</Link>
            </Button>
          )}
          <Button asChild className="w-full bg-emerald-800 hover:bg-emerald-900">
            <Link href="/contacts">
              <Phone className="h-4 w-4" />
              {siteConfig.ui.consultation}
            </Link>
          </Button>
        </div>
      </nav>
    </div>
  );
}

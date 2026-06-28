"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  className?: string;
  variant?: "light" | "dark";
};

export function UserMenu({ className, variant = "light" }: UserMenuProps) {
  const { data: session, status } = useSession();
  const isDark = variant === "dark";

  if (status === "loading") {
    return (
      <div
        className={cn(
          "h-9 w-20 animate-pulse rounded-full",
          isDark ? "bg-white/10" : "bg-emerald-50",
          className
        )}
      />
    );
  }

  if (!session?.user) {
    return (
      <Button
        asChild
        size="sm"
        variant={isDark ? "ghost" : "outline"}
        className={cn(
          isDark
            ? "text-white/80 hover:bg-white/10 hover:text-white"
            : "border-emerald-200 text-emerald-800 hover:bg-emerald-50",
          className
        )}
      >
        <Link href="/login">Войти</Link>
      </Button>
    );
  }

  const initial =
    session.user.name?.trim().charAt(0).toUpperCase() ||
    session.user.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-full py-1 pl-1 pr-3",
          isDark ? "bg-white/[0.06]" : "bg-emerald-50"
        )}
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
              isDark ? "bg-[#1a2e1a] text-white/70" : "bg-emerald-800 text-white"
            )}
          >
            {initial}
          </span>
        )}
        <span
          className={cn(
            "hidden max-w-[120px] truncate text-sm sm:inline",
            isDark ? "text-white/80" : "text-emerald-900"
          )}
        >
          {session.user.name ?? session.user.email}
        </span>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Выйти"
        className={cn(
          "h-9 w-9 shrink-0",
          isDark
            ? "text-white/50 hover:bg-white/10 hover:text-white"
            : "text-stone-500 hover:bg-emerald-50 hover:text-emerald-800"
        )}
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SidebarUserFooter() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="border-t border-[#e5e7eb] bg-[#f9fafb] p-3">
        <div className="h-14 animate-pulse rounded-xl bg-[#f3f4f6]" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="border-t border-[#e5e7eb] bg-[#f9fafb] p-3">
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
          <Button
            asChild
            variant="ghost"
            className="h-auto w-full justify-start gap-3 rounded-xl bg-white px-3 py-3 text-[#111827] hover:bg-[#f0fdf4]"
          >
            <Link href="/login">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0fdf4] ring-2 ring-[#16a34a]/30">
                <User className="h-4 w-4 text-[#16a34a]" />
              </span>
              <span className="text-left">
                <span className="block text-[13px] font-medium">Войти</span>
                <span className="block text-[11px] text-[#6b7280]">Google или GitHub</span>
              </span>
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const initial =
    session.user.name?.trim().charAt(0).toUpperCase() ||
    session.user.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <div className="border-t border-[#e5e7eb] bg-[#f9fafb] p-3">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-[#e5e7eb] transition-shadow hover:shadow-md"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[#16a34a]/40 ring-offset-2 ring-offset-white"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-[12px] font-semibold text-white ring-2 ring-[#16a34a]/30 ring-offset-2 ring-offset-white">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[#111827]">
            {session.user.name ?? "Пользователь"}
          </p>
          <p className="truncate text-[11px] text-[#6b7280]">
            {session.user.email ?? "Аккаунт"}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Выйти"
          className="h-8 w-8 shrink-0 text-[#6b7280] hover:bg-[#f0fdf4] hover:text-[#16a34a]"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </motion.div>
    </div>
  );
}

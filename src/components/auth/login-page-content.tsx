"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { GitHubSignInButton } from "@/components/auth/github-sign-in-button";

type LoginPageContentProps = {
  redirectTo: string;
};

const FLOATING_LEAVES = [
  { left: "8%", delay: "0s", duration: "10s", size: "1.5rem" },
  { left: "22%", delay: "2s", duration: "11s", size: "1.25rem" },
  { left: "68%", delay: "1s", duration: "9s", size: "1.75rem" },
  { left: "85%", delay: "3s", duration: "12s", size: "1.35rem" },
  { left: "48%", delay: "4s", duration: "8s", size: "1.6rem" },
];

export function LoginPageContent({ redirectTo }: LoginPageContentProps) {
  const [logoSrc, setLogoSrc] = useState("/multiflora-logo.png");

  return (
    <div className="login-page-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {FLOATING_LEAVES.map((leaf, index) => (
        <span
          key={index}
          className="login-floating-leaf pointer-events-none fixed bottom-0 select-none"
          style={{
            left: leaf.left,
            fontSize: leaf.size,
            animationDelay: leaf.delay,
            animationDuration: leaf.duration,
          }}
          aria-hidden
        >
          🌿
        </span>
      ))}

      <motion.div
        className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-900/5"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/garden" className="inline-block">
              <Image
                src={logoSrc}
                alt="MultiFlora Garden"
                width={120}
                height={120}
                className="mx-auto mb-4"
                priority
                onError={() => setLogoSrc("/multiflora-logo.svg")}
              />
            </Link>
          </motion.div>

          <motion.h1
            className="text-2xl font-bold text-stone-900"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Добро пожаловать
          </motion.h1>

          <motion.p
            className="mt-2 text-sm text-stone-500"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Войдите или создайте аккаунт через Google или GitHub.
          </motion.p>
        </div>

        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GoogleSignInButton
              callbackUrl={redirectTo}
              className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <GitHubSignInButton
              callbackUrl={redirectTo}
              className="transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.35)]"
            />
          </motion.div>
        </div>

        <motion.p
          className="mt-6 text-center text-xs text-stone-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          Продолжая, вы соглашаетесь с условиями использования сервиса.
        </motion.p>

        <motion.p
          className="mt-4 text-center text-sm text-stone-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.75 }}
        >
          <Link href="/" className="text-emerald-700 hover:underline">
            Вернуться на главную
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

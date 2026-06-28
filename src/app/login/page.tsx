import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf } from "lucide-react";
import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { GitHubSignInButton } from "@/components/auth/github-sign-in-button";

export const metadata: Metadata = {
  title: "Вход",
  description: "Войдите или зарегистрируйтесь в MultiFlora Garden",
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    redirect(callbackUrl ?? "/");
  }

  const redirectTo = callbackUrl ?? "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50/80 to-stone-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-900/5">
        <div className="mb-8 text-center">
          <Link
            href="/garden"
            className="mx-auto mb-6 inline-flex items-center gap-2 text-emerald-800"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">MultiFlora Garden</span>
          </Link>
          <h1 className="text-2xl font-bold text-stone-900">Добро пожаловать</h1>
          <p className="mt-2 text-sm text-stone-500">
            Войдите или создайте аккаунт через Google или GitHub.
          </p>
        </div>

        <div className="space-y-3">
          <GoogleSignInButton callbackUrl={redirectTo} />
          <GitHubSignInButton callbackUrl={redirectTo} />
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          Продолжая, вы соглашаетесь с условиями использования сервиса.
        </p>

        <p className="mt-4 text-center text-sm text-stone-500">
          <Link href="/" className="text-emerald-700 hover:underline">
            Вернуться на главную
          </Link>
        </p>
      </div>
    </div>
  );
}

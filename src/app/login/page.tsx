import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginPageContent } from "@/components/auth/login-page-content";

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

  return <LoginPageContent redirectTo={redirectTo} />;
}

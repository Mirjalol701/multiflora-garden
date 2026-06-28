import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedArtifact } from "@/actions/workspace";
import { MarkdownContent } from "@/components/ai-chat/markdown-content";
import { MultiFloraBrandLogo } from "@/components/ai-chat/multiflora-logo";
import Link from "next/link";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const artifact = await getSharedArtifact(token);
  return {
    title: artifact?.title ?? "Artifact",
    description: "Поделённый Artifact из MultiFlora AI",
  };
}

export default async function SharedArtifactPage({ params }: PageProps) {
  const { token } = await params;
  const artifact = await getSharedArtifact(token);

  if (!artifact) notFound();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#e5e7eb] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MultiFloraBrandLogo size="sm" />
            <span className="text-[14px] font-semibold text-[#111827]">MultiFlora AI</span>
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-[#16a34a] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#15803d]"
          >
            Создать свой
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <span className="rounded-full bg-[#f0fdf4] px-3 py-1 text-[11px] font-medium text-[#16a34a]">
          {artifact.type}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#111827]">
          {artifact.title}
        </h1>
        <p className="mt-2 text-[13px] text-[#9ca3af]">
          v{artifact.version} · {new Date(artifact.createdAt).toLocaleDateString("ru-RU")}
        </p>
        <article className="prose-ai mt-8 rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-6">
          <MarkdownContent content={artifact.content} />
        </article>
      </main>
    </div>
  );
}

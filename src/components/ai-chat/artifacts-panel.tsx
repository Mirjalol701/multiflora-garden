"use client";

import { motion } from "framer-motion";
import { ExternalLink, Share2, Shapes, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

type ArtifactsPanelProps = {
  onOpenArtifact: (id: string) => void;
};

export function ArtifactsPanel({ onOpenArtifact }: ArtifactsPanelProps) {
  const { state, deleteArtifact, shareArtifact, activeArtifactId } = useWorkspace();

  const handleShare = async (id: string, title: string) => {
    const token = await shareArtifact(id);
    if (!token) return;
    const url = `${window.location.origin}/a/${token}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована", description: title });
  };

  return (
    <div className="mx-auto flex h-full min-h-full max-w-3xl flex-col px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#111827]">Artifacts</h1>
        <p className="mt-1 text-[14px] text-[#6b7280]">
          Документы, код и планы из ваших диалогов
        </p>
      </div>

      {state.artifacts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-[#f0fdf4]">
            <Shapes className="h-6 w-6 text-[#16a34a]" />
          </div>
          <p className="max-w-sm text-[15px] text-[#6b7280]">
            Сохраняйте ответы AI как Artifact прямо из чата — кнопка «Сохранить»
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {state.artifacts.map((artifact) => (
            <motion.li
              key={artifact.id}
              layout
              className={cn(
                "group rounded-xl border p-4 transition-colors",
                activeArtifactId === artifact.id
                  ? "border-[#bbf7d0] bg-[#f0fdf4]"
                  : "border-[#e5e7eb] bg-white hover:border-[#bbf7d0]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpenArtifact(artifact.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block font-medium text-[#111827]">{artifact.title}</span>
                  <span className="mt-1 line-clamp-2 text-[13px] text-[#6b7280]">
                    {artifact.content.slice(0, 160)}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-2 text-[11px] text-[#9ca3af]">
                    <span className="rounded bg-[#f3f4f6] px-1.5 py-0.5">{artifact.type}</span>
                    v{artifact.version}
                  </span>
                </button>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleShare(artifact.id, artifact.title)}
                    className="rounded-lg p-1.5 text-[#6b7280] hover:bg-[#f0fdf4] hover:text-[#16a34a]"
                    aria-label="Поделиться"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                  {artifact.shareToken && (
                    <a
                      href={`/a/${artifact.shareToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-[#6b7280] hover:bg-[#f0fdf4] hover:text-[#16a34a]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteArtifact(artifact.id)}
                    className="rounded-lg p-1.5 text-[#6b7280] hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

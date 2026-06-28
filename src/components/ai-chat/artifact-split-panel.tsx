"use client";

import { X, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { MarkdownContent } from "@/components/ai-chat/markdown-content";

export function ArtifactSplitPanel() {
  const { state, activeArtifactId, setActiveArtifactId, updateArtifact, shareArtifact } =
    useWorkspace();

  const artifact = state.artifacts.find((a) => a.id === activeArtifactId);
  if (!artifact) return null;

  const handleShare = async () => {
    const token = await shareArtifact(artifact.id);
    if (!token) return;
    const url = `${window.location.origin}/a/${token}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована" });
  };

  return (
    <aside className="flex h-full w-[min(420px,40vw)] shrink-0 flex-col border-l border-[#e5e7eb] bg-[#fafafa]">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-3">
        <input
          value={artifact.title}
          onChange={(e) => updateArtifact(artifact.id, { title: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#111827] outline-none"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShare}
            className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f0fdf4] hover:text-[#16a34a]"
            aria-label="Поделиться"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveArtifactId(null)}
            className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6]"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <textarea
          value={artifact.content}
          onChange={(e) => updateArtifact(artifact.id, { content: e.target.value })}
          className="h-full min-h-[300px] w-full resize-none rounded-xl border border-[#e5e7eb] bg-white p-4 font-mono text-[13px] leading-relaxed text-[#111827] outline-none focus:border-[#16a34a]"
        />
      </div>
      <div className="border-t border-[#e5e7eb] bg-white p-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
          Превью
        </p>
        <div className="max-h-40 overflow-y-auto rounded-lg bg-[#f3f4f6] p-3">
          <MarkdownContent content={artifact.content} />
        </div>
      </div>
    </aside>
  );
}

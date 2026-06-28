"use client";

import { FolderOpen, Brain, X } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";

type ContextBarProps = {
  onOpenMemory: () => void;
};

export function ContextBar({ onOpenMemory }: ContextBarProps) {
  const { activeProject, approvedMemories, setActiveProjectId } = useWorkspace();

  if (!activeProject && approvedMemories.length === 0) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 pb-2">
      {activeProject && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[12px] text-[#15803d]">
          <FolderOpen className="h-3 w-3" />
          {activeProject.name}
          <button
            type="button"
            onClick={() => setActiveProjectId(null)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-[#dcfce7]"
            aria-label="Снять проект"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
      {approvedMemories.length > 0 && (
        <button
          type="button"
          onClick={onOpenMemory}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-[12px] text-[#6b7280] hover:border-[#bbf7d0] hover:text-[#111827]"
        >
          <Brain className="h-3 w-3 text-[#16a34a]" />
          {approvedMemories.length} фактов в памяти
        </button>
      )}
    </div>
  );
}

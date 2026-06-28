"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

type ProjectsPanelProps = {
  onStartChat: (projectId: string) => void;
};

export function ProjectsPanel({ onStartChat }: ProjectsPanelProps) {
  const { state, activeProject, createProject, deleteProject, setActiveProjectId, updateProject } =
    useWorkspace();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = createProject({ name: name.trim(), instructions: instructions.trim() || undefined });
    setName("");
    setInstructions("");
    setCreating(false);
    onStartChat(id);
  };

  return (
    <div className="mx-auto flex h-full min-h-full max-w-3xl flex-col px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Проекты</h1>
          <p className="mt-1 text-[14px] text-[#6b7280]">
            Контекст, инструкции и чаты в одном workspace
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#15803d]"
        >
          <Plus className="h-4 w-4" />
          Новый проект
        </motion.button>
      </div>

      {creating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="mb-6 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-5"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название проекта"
            className="mb-3 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#16a34a]"
            autoFocus
          />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Инструкции для AI (тон, цели, контекст)…"
            rows={3}
            className="mb-4 w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#16a34a]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-[#16a34a] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#15803d]"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-lg px-4 py-2 text-[13px] text-[#6b7280] hover:bg-[#e5e7eb]/60"
            >
              Отмена
            </button>
          </div>
        </motion.div>
      )}

      {state.projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-[#f0fdf4]">
            <FolderOpen className="h-6 w-6 text-[#16a34a]" />
          </div>
          <p className="text-[15px] text-[#6b7280]">Создайте первый проект — AI запомнит контекст</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {state.projects.map((project) => (
            <li key={project.id}>
              <div
                className={cn(
                  "group rounded-xl border p-4 transition-colors",
                  activeProject?.id === project.id
                    ? "border-[#bbf7d0] bg-[#f0fdf4]"
                    : "border-[#e5e7eb] bg-white hover:border-[#bbf7d0]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveProjectId(project.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block font-medium text-[#111827]">{project.name}</span>
                    {project.instructions && (
                      <span className="mt-1 line-clamp-2 text-[13px] text-[#6b7280]">
                        {project.instructions}
                      </span>
                    )}
                    <span className="mt-2 inline-block text-[11px] text-[#9ca3af]">
                      {state.chats.filter((c) => c.projectId === project.id).length} чатов ·{" "}
                      {state.artifacts.filter((a) => a.projectId === project.id).length} artifacts
                    </span>
                  </button>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onStartChat(project.id)}
                      className="rounded-lg px-2.5 py-1.5 text-[12px] text-[#16a34a] hover:bg-[#dcfce7]"
                    >
                      Чат
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(project.id)}
                      className="rounded-lg p-1.5 text-[#6b7280] hover:bg-red-50 hover:text-red-600"
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {activeProject?.id === project.id && (
                  <textarea
                    defaultValue={project.instructions ?? ""}
                    onBlur={(e) =>
                      updateProject(project.id, { instructions: e.target.value })
                    }
                    placeholder="Добавьте инструкции для AI…"
                    rows={2}
                    className="mt-3 w-full resize-none rounded-lg border border-[#bbf7d0] bg-white px-3 py-2 text-[13px] outline-none"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

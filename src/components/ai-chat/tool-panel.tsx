"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  FolderOpen,
  Plus,
  Shapes,
  Sparkles,
} from "lucide-react";
import type { SidebarMode, SidebarView } from "@/components/ai-chat/sidebar";

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

type ToolPanelProps = {
  view: SidebarView;
  mode: SidebarMode;
  onNewChat: () => void;
  onOpenCustomize: () => void;
};

const panels: Record<
  Exclude<SidebarView, "chat" | "memory">,
  {
    title: string;
    description: string;
    icon: typeof FolderOpen;
    cta: string;
    features: string[];
  }
> = {
  projects: {
    title: "Проекты",
    description:
      "Группируйте чаты, файлы и инструкции AI в одном workspace — как в Claude Projects и Notion.",
    icon: FolderOpen,
    cta: "Создать проект",
    features: ["Контекст проекта", "Общие чаты", "Custom instructions"],
  },
  artifacts: {
    title: "Artifacts",
    description:
      "Сохраняйте код, документы и результаты из диалогов. Открывайте в split-view рядом с чатом.",
    icon: Shapes,
    cta: "Начать в чате",
    features: ["Код и документы", "Split panel", "Экспорт"],
  },
  customize: {
    title: "Настройки AI",
    description:
      "Тон ответов, язык, модель и поведение ассистента под ваш workflow.",
    icon: Briefcase,
    cta: "Открыть настройки",
    features: ["Стиль ответов", "Модель", "Память"],
  },
};

const modeLabels: Record<SidebarMode, string> = {
  chat: "Chat",
  cowork: "Cowork",
  code: "Code",
};

export function ToolPanel({ view, mode, onNewChat, onOpenCustomize }: ToolPanelProps) {
  if (view === "chat" || view === "memory") return null;

  const panel = panels[view];
  const Icon = panel.icon;

  const handleCta = () => {
    if (view === "customize") onOpenCustomize();
    else onNewChat();
  };

  return (
    <div className="flex h-full min-h-full flex-col items-center justify-center bg-white px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-[#f0fdf4] shadow-sm">
          <Icon className="h-6 w-6 text-[#16a34a]" strokeWidth={1.75} />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1 text-[11px] font-medium text-[#6b7280]">
          <Sparkles className="h-3 w-3 text-[#16a34a]" />
          Режим {modeLabels[mode]}
        </span>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#111827]">
          {panel.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#6b7280]">{panel.description}</p>

        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {panel.features.map((f) => (
            <li
              key={f}
              className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] text-[#374151]"
            >
              {f}
            </li>
          ))}
        </ul>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCta}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#15803d]"
        >
          {view === "projects" && <Plus className="h-4 w-4" />}
          {panel.cta}
          <ArrowRight className="h-4 w-4 opacity-80" />
        </motion.button>

        <p className="mt-4 text-[12px] text-[#9ca3af]">
          {view === "projects"
            ? "Полная версия проектов — в следующем релизе"
            : view === "artifacts"
              ? "Сохраняйте ответы AI прямо из чата"
              : "Настройте AI под себя"}
        </p>
      </motion.div>
    </div>
  );
}

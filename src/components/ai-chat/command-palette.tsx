"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Briefcase,
  FolderOpen,
  MessageSquare,
  Plus,
  Search,
  Shapes,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/components/ai-chat/chat-app";
import type { SidebarView } from "@/components/ai-chat/sidebar";
import type {
  WorkspaceArtifact,
  WorkspaceMemory,
  WorkspaceProject,
} from "@/lib/workspace-types";

const spring = { type: "spring" as const, stiffness: 400, damping: 32 };

type CommandPaletteProps = {
  open: boolean;
  chats: ChatSession[];
  projects: WorkspaceProject[];
  artifacts: WorkspaceArtifact[];
  memories: WorkspaceMemory[];
  onClose: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onNavigate: (view: SidebarView) => void;
  onOpenAbout: () => void;
  onSelectProject: (id: string) => void;
  onSelectArtifact: (id: string) => void;
  onOpenMemory: () => void;
};

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  group: string;
  action: () => void;
};

export function CommandPalette({
  open,
  chats,
  projects,
  artifacts,
  memories,
  onClose,
  onSelectChat,
  onNewChat,
  onNavigate,
  onOpenAbout,
  onSelectProject,
  onSelectArtifact,
  onOpenMemory,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const pendingCount = memories.filter((m) => m.status === "PENDING").length;

  const items = useMemo<CommandItem[]>(() => {
    const actions: CommandItem[] = [
      {
        id: "new-chat",
        label: "Новый чат",
        hint: "Ctrl+N",
        icon: Plus,
        group: "Действия",
        action: () => {
          onNewChat();
          onClose();
        },
      },
      {
        id: "nav-memory",
        label: "Memory Inbox",
        hint: pendingCount > 0 ? `${pendingCount} новых` : undefined,
        icon: Brain,
        group: "Действия",
        action: () => {
          onOpenMemory();
          onClose();
        },
      },
      {
        id: "nav-projects",
        label: "Проекты",
        icon: FolderOpen,
        group: "Навигация",
        action: () => {
          onNavigate("projects");
          onClose();
        },
      },
      {
        id: "nav-artifacts",
        label: "Artifacts",
        icon: Shapes,
        group: "Навигация",
        action: () => {
          onNavigate("artifacts");
          onClose();
        },
      },
      {
        id: "nav-customize",
        label: "Настройки AI",
        icon: Briefcase,
        group: "Навигация",
        action: () => {
          onNavigate("customize");
          onClose();
        },
      },
      {
        id: "nav-about",
        label: "О нас",
        icon: Sparkles,
        group: "Навигация",
        action: () => {
          onOpenAbout();
          onClose();
        },
      },
    ];

    const projectItems: CommandItem[] = projects.map((p) => ({
      id: `project-${p.id}`,
      label: p.name,
      hint: "Проект",
      icon: FolderOpen,
      group: "Проекты",
      action: () => {
        onSelectProject(p.id);
        onClose();
      },
    }));

    const artifactItems: CommandItem[] = artifacts.map((a) => ({
      id: `artifact-${a.id}`,
      label: a.title,
      hint: a.type,
      icon: Shapes,
      group: "Artifacts",
      action: () => {
        onSelectArtifact(a.id);
        onClose();
      },
    }));

    const chatItems: CommandItem[] = chats.map((chat) => ({
      id: `chat-${chat.id}`,
      label: chat.title,
      hint: chat.messages.length > 0 ? `${chat.messages.length} сообщ.` : "Пустой",
      icon: MessageSquare,
      group: "Чаты",
      action: () => {
        onSelectChat(chat.id);
        onClose();
      },
    }));

    return [...actions, ...projectItems, ...artifactItems, ...chatItems];
  }, [
    artifacts,
    chats,
    onClose,
    onNavigate,
    onNewChat,
    onOpenAbout,
    onOpenMemory,
    onSelectArtifact,
    onSelectChat,
    onSelectProject,
    pendingCount,
    projects,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatFiltered = filtered;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runActive = () => {
    const item = flatFiltered[activeIndex];
    item?.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runActive();
    }
  };

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/20 px-4 pt-[12vh] backdrop-blur-sm">
          <motion.button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-label="Командная палитра"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={spring}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-[#6b7280]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Чаты, проекты, artifacts, команды…"
                className="flex-1 bg-transparent text-[15px] text-[#111827] placeholder:text-[#6b7280] outline-none"
              />
              <kbd className="hidden rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-1.5 py-0.5 text-[10px] text-[#6b7280] sm:inline">
                ESC
              </kbd>
            </div>

            <ul className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
              {grouped.length === 0 && (
                <li className="px-4 py-8 text-center text-[13px] text-[#6b7280]">
                  Ничего не найдено
                </li>
              )}
              {grouped.map(([group, groupItems]) => (
                <li key={group}>
                  <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                    {group}
                  </p>
                  <ul>
                    {groupItems.map((item) => {
                      flatIndex += 1;
                      const idx = flatIndex;
                      const Icon = item.icon;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={item.action}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                              activeIndex === idx
                                ? "bg-[#f0fdf4] text-[#111827]"
                                : "text-[#374151] hover:bg-[#f9fafb]"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                activeIndex === idx ? "text-[#16a34a]" : "text-[#9ca3af]"
                              )}
                            />
                            <span className="flex-1 truncate text-[14px]">{item.label}</span>
                            {item.hint && (
                              <span className="text-[11px] text-[#9ca3af]">{item.hint}</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

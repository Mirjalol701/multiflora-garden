"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Wrench, Database, Sparkles } from "lucide-react";
import {
  PHASE_LABELS,
  type AgentRunPhase,
  type AgentSSEEvent,
} from "@/lib/agent-events";

export type ThinkingState = {
  phase: AgentRunPhase;
  tools: { name: string; summary?: string }[];
  memoryCount: number;
};

const PHASE_ICONS: Partial<Record<AgentRunPhase, typeof Brain>> = {
  assembling_context: Database,
  reasoning: Brain,
  tool_calling: Wrench,
  streaming: Sparkles,
  post_processing: Database,
};

type ThinkingPanelProps = {
  state: ThinkingState | null;
  streaming?: boolean;
};

export function buildThinkingStateFromEvent(
  prev: ThinkingState | null,
  event: AgentSSEEvent
): ThinkingState | null {
  if (event.type === "phase") {
    return {
      phase: event.phase,
      tools: prev?.tools ?? [],
      memoryCount: prev?.memoryCount ?? 0,
    };
  }
  if (event.type === "tool_start") {
    return {
      phase: prev?.phase ?? "tool_calling",
      tools: [...(prev?.tools ?? []), { name: event.tool }],
      memoryCount: prev?.memoryCount ?? 0,
    };
  }
  if (event.type === "tool_result") {
    const tools = [...(prev?.tools ?? [])];
    const idx = tools.map((t) => t.name).lastIndexOf(event.tool);
    if (idx >= 0) tools[idx] = { name: event.tool, summary: event.summary };
    return {
      phase: prev?.phase ?? "tool_calling",
      tools,
      memoryCount: prev?.memoryCount ?? 0,
    };
  }
  if (event.type === "memory_used") {
    return {
      phase: prev?.phase ?? "assembling_context",
      tools: prev?.tools ?? [],
      memoryCount: event.count,
    };
  }
  if (event.type === "done") return null;
  return prev;
}

const TOOL_LABELS: Record<string, string> = {
  image_generation: "Создаю изображение (DALL-E)",
  web_search: "Веб-поиск",
};

export function ThinkingPanel({ state, streaming }: ThinkingPanelProps) {
  if (!state && !streaming) return null;

  const phase = state?.phase ?? (streaming ? "streaming" : "reasoning");
  const Icon = PHASE_ICONS[phase] ?? Brain;
  const label = streaming && phase !== "tool_calling"
    ? "Пишу…"
    : PHASE_LABELS[phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="flex max-w-[90%] gap-3 rounded-2xl bg-[#f3f4f6] px-4 py-3.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#dcfce7]">
          <Icon className="h-3.5 w-3.5 text-[#16a34a]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="ai-dot-bounce h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
              <span className="ai-dot-bounce ai-dot-bounce-delay-1 h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
              <span className="ai-dot-bounce ai-dot-bounce-delay-2 h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
            </span>
            <span className="text-[13px] font-medium text-[#111827]">{label}</span>
          </div>

          <AnimatePresence>
            {state && state.memoryCount > 0 && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1.5 text-[12px] text-[#6b7280]"
              >
                Память: {state.memoryCount} фрагментов подключено
              </motion.p>
            )}

            {state && state.tools.length > 0 && (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 space-y-1"
              >
                {state.tools.map((t, i) => (
                  <li
                    key={`${t.name}-${i}`}
                    className="flex items-center gap-1.5 text-[11px] text-[#6b7280]"
                  >
                    <Wrench className="h-3 w-3 shrink-0 text-[#16a34a]" />
                    <span className="font-medium text-[#374151]">
                      {TOOL_LABELS[t.name] ?? t.name}
                    </span>
                    {t.summary && (
                      <span className="truncate">— {t.summary}</span>
                    )}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

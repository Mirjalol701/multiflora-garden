"use client";

import { motion } from "framer-motion";
import { Brain, Check, X } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

export function MemoryInbox() {
  const { state, updateMemoryStatus, deleteMemory, approvedMemories } = useWorkspace();
  const pending = state.memories.filter((m) => m.status === "PENDING");

  return (
    <div className="mx-auto flex h-full min-h-full max-w-3xl flex-col px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#111827]">Memory Inbox</h1>
        <p className="mt-1 text-[14px] text-[#6b7280]">
          AI предлагает запомнить факты — вы подтверждаете
        </p>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Ожидают ({pending.length})
          </h2>
          <ul className="space-y-2">
            {pending.map((memory) => (
              <motion.li
                key={memory.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4"
              >
                <p className="text-[14px] text-[#111827]">{memory.content}</p>
                {memory.source && (
                  <p className="mt-1 text-[11px] text-[#9ca3af]">из: {memory.source}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateMemoryStatus(memory.id, "APPROVED")}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#16a34a] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#15803d]"
                  >
                    <Check className="h-3 w-3" />
                    Запомнить
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMemoryStatus(memory.id, "REJECTED")}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] text-[#6b7280] hover:bg-[#e5e7eb]/60"
                  >
                    <X className="h-3 w-3" />
                    Отклонить
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#6b7280]">
          Активная память ({approvedMemories.length})
        </h2>
        {approvedMemories.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Brain className="mb-3 h-8 w-8 text-[#d1d5db]" />
            <p className="text-[14px] text-[#6b7280]">
              Память пуста. AI будет предлагать факты после диалогов.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {approvedMemories.map((memory) => (
              <li
                key={memory.id}
                className={cn(
                  "group flex items-start justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4"
                )}
              >
                <div>
                  <p className="text-[14px] text-[#111827]">{memory.content}</p>
                  {memory.source && (
                    <p className="mt-1 text-[11px] text-[#9ca3af]">{memory.source}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteMemory(memory.id)}
                  className="shrink-0 rounded p-1 text-[#9ca3af] opacity-0 hover:text-red-600 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

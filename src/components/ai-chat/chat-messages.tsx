"use client";

import { motion } from "framer-motion";
import { Copy, RefreshCw, Shapes } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MultiFloraBrandLogo } from "@/components/ai-chat/multiflora-logo";
import { MarkdownContent } from "@/components/ai-chat/markdown-content";
import { ThinkingPanel, type ThinkingState } from "@/components/ai-chat/thinking-panel";
import type { ChatMessage } from "@/components/ai-chat/chat-app";

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

type ChatMessagesProps = {
  messages: ChatMessage[];
  isLoading?: boolean;
  isStreaming?: boolean;
  thinkingState?: ThinkingState | null;
  onRegenerate?: () => void;
  onSaveArtifact?: (content: string) => void;
};

function MessageActions({
  content,
  onRegenerate,
  onSaveArtifact,
  showRegenerate,
  showSave,
}: {
  content: string;
  onRegenerate?: () => void;
  onSaveArtifact?: (content: string) => void;
  showRegenerate?: boolean;
  showSave?: boolean;
}) {
  const copy = async () => {
    await navigator.clipboard.writeText(content);
    toast({ title: "Скопировано" });
  };

  return (
    <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#6b7280] hover:bg-[#e5e7eb]/60 hover:text-[#111827]"
      >
        <Copy className="h-3 w-3" />
        Копировать
      </button>
      {showSave && onSaveArtifact && (
        <button
          type="button"
          onClick={() => onSaveArtifact(content)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#6b7280] hover:bg-[#e5e7eb]/60 hover:text-[#111827]"
        >
          <Shapes className="h-3 w-3" />
          Artifact
        </button>
      )}
      {showRegenerate && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#6b7280] hover:bg-[#e5e7eb]/60 hover:text-[#111827]"
        >
          <RefreshCw className="h-3 w-3" />
          Ещё раз
        </button>
      )}
    </div>
  );
}

export function ChatMessages({
  messages,
  isLoading,
  isStreaming,
  thinkingState,
  onRegenerate,
  onSaveArtifact,
}: ChatMessagesProps) {
  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="mx-auto w-full max-w-3xl bg-white px-4 py-8">
      <div className="space-y-6">
        {messages.map((msg, i) => {
          if (msg.role === "assistant" && !msg.content.trim()) return null;

          return (
          <motion.div
            key={msg.id}
            initial={
              msg.role === "user"
                ? { opacity: 0, x: 24 }
                : { opacity: 0, x: -24 }
            }
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: Math.min(i * 0.03, 0.15) }}
            className={cnGroup(msg.role)}
          >
            {msg.role === "user" ? (
              <div className="group max-w-[85%]">
                <div className="rounded-2xl rounded-br-md bg-[#16a34a] px-4 py-3 text-[14px] leading-relaxed text-white">
                  {msg.content}
                </div>
                <MessageActions content={msg.content} />
              </div>
            ) : (
              <div className="group flex max-w-[90%] gap-3">
                <MultiFloraBrandLogo size="xs" className="mt-1 shrink-0 shadow-none" />
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl rounded-bl-md bg-[#f3f4f6] px-4 py-3.5">
                    <div className="text-[14px] leading-relaxed text-[#111827]">
                      <MarkdownContent content={msg.content} />
                      {msg.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.imageUrl}
                          alt="Сгенерированное изображение"
                          className="mt-3 max-h-[480px] w-auto max-w-full rounded-xl border border-[#e5e7eb] object-contain"
                        />
                      )}
                    </div>
                  </div>
                  <MessageActions
                    content={msg.content}
                    onRegenerate={onRegenerate}
                    onSaveArtifact={onSaveArtifact}
                    showRegenerate={msg.id === lastAssistantId && !isLoading && !isStreaming}
                    showSave={msg.role === "assistant" && !!msg.content}
                  />
                </div>
              </div>
            )}
          </motion.div>
          );
        })}

        {(isLoading || isStreaming) && (
          <ThinkingPanel state={thinkingState ?? null} streaming={isStreaming} />
        )}
      </div>
    </div>
  );
}

function cnGroup(role: ChatMessage["role"]) {
  return role === "user" ? "flex justify-end" : "flex justify-start";
}

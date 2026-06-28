"use client";

import { motion } from "framer-motion";
import { MultiFloraBrandLogo } from "@/components/ai-chat/multiflora-logo";

const steps = ["Думаю", "Формирую ответ", "Пишу"];

type ThinkingIndicatorProps = {
  streaming?: boolean;
};

export function ThinkingIndicator({ streaming }: ThinkingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="flex max-w-[85%] gap-3 rounded-2xl bg-[#f3f4f6] px-4 py-3.5">
        <MultiFloraBrandLogo size="xs" className="mt-0.5 shadow-none" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="ai-dot-bounce h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
              <span className="ai-dot-bounce ai-dot-bounce-delay-1 h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
              <span className="ai-dot-bounce ai-dot-bounce-delay-2 h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
            </span>
            <span className="text-[13px] font-medium text-[#111827]">
              {streaming ? "Пишу…" : "Думаю…"}
            </span>
          </div>
          {!streaming && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-1.5 text-[12px] text-[#6b7280]"
            >
              {steps.join(" · ")}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

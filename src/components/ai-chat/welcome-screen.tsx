"use client";

import { motion } from "framer-motion";
import { Bot, Code2, MessageSquare, Sparkles, Wand2, type LucideIcon } from "lucide-react";
import { MultiFloraBrandLogo } from "@/components/ai-chat/multiflora-logo";
import type { SidebarMode } from "@/components/ai-chat/sidebar";

const modeConfig: Record<
  SidebarMode,
  {
    heading: string;
    subtitle: string;
    suggestions: { text: string; icon: LucideIcon }[];
  }
> = {
  chat: {
    heading: "Чем займёмся?",
    subtitle: "AI operating system — думаю в контексте ваших проектов, памяти и артефактов.",
    suggestions: [
      { text: "Помоги написать деловое письмо", icon: MessageSquare },
      { text: "Объясни сложную тему простыми словами", icon: Bot },
      { text: "Составь план проекта на неделю", icon: Sparkles },
      { text: "Придумай идеи для нового продукта", icon: Wand2 },
    ],
  },
  cowork: {
    heading: "Чем займёмся?",
    subtitle: "Режим Cowork — стратегия, решения, trade-offs. Думаю как cofounder.",
    suggestions: [
      { text: "Составить бизнес-план для стартапа", icon: Sparkles },
      { text: "Разобрать сложную проблему по шагам", icon: Bot },
      { text: "Подготовить презентацию для клиента", icon: MessageSquare },
      { text: "Написать техническое задание", icon: Wand2 },
    ],
  },
  code: {
    heading: "Чем займёмся?",
    subtitle: "Режим Code — архитектура, код, execution. Инженерный уровень точности.",
    suggestions: [
      { text: "Напиши REST API на Python", icon: Code2 },
      { text: "Исправь ошибку в моём коде", icon: Bot },
      { text: "Объясни этот алгоритм", icon: MessageSquare },
      { text: "Создай компонент React с TypeScript", icon: Sparkles },
    ],
  },
};

const spring = { type: "spring" as const, stiffness: 300, damping: 28 };

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: spring },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
};

type WelcomeScreenProps = {
  mode: SidebarMode;
  onSuggestionClick: (question: string) => void;
};

export function WelcomeScreen({ mode, onSuggestionClick }: WelcomeScreenProps) {
  const config = modeConfig[mode];

  return (
    <div className="relative flex h-full min-h-full flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center"
      >
        <motion.div variants={fadeUp} className="relative mb-8">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <MultiFloraBrandLogo size="lg" />
          </motion.div>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mb-3 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl"
        >
          {config.heading}
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="max-w-md text-[15px] leading-relaxed text-[#6b7280]"
        >
          {config.subtitle}
        </motion.p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2"
      >
        {config.suggestions.map((item) => (
          <motion.button
            key={item.text}
            variants={cardVariant}
            type="button"
            onClick={() => onSuggestionClick(item.text)}
            whileHover={{ y: -3, borderColor: "#16a34a" }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            className="group rounded-xl border border-[#e5e7eb] bg-white px-5 py-4 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a] transition-transform group-hover:scale-105">
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="block text-[14px] leading-snug text-[#111827]">
              {item.text}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

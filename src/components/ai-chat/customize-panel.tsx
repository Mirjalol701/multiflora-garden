"use client";

import { motion } from "framer-motion";
import { ArrowRight, Settings2 } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import type { AiPreferences } from "@/lib/workspace-types";

const toneOptions: { id: AiPreferences["tone"]; label: string; desc: string }[] = [
  { id: "concise", label: "Кратко", desc: "Минимум слов, максимум смысла" },
  { id: "balanced", label: "Баланс", desc: "Структура + детали по делу" },
  { id: "detailed", label: "Подробно", desc: "Глубина и разбор нюансов" },
];

const proactivityOptions: { id: AiPreferences["proactivity"]; label: string }[] = [
  { id: "low", label: "По запросу" },
  { id: "medium", label: "Умеренно" },
  { id: "high", label: "Проактивно" },
];

export function CustomizePanel() {
  const { state, updateAiPreferences } = useWorkspace();
  const prefs = state.aiPreferences;

  return (
    <div className="mx-auto flex h-full min-h-full max-w-2xl flex-col px-6 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e5e7eb] bg-[#f0fdf4]">
          <Settings2 className="h-5 w-5 text-[#16a34a]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Настройки AI</h1>
          <p className="text-[14px] text-[#6b7280]">Как MultiFlora думает и отвечает</p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-[13px] font-semibold text-[#111827]">Стиль ответов</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {toneOptions.map((opt) => (
            <motion.button
              key={opt.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => updateAiPreferences({ tone: opt.id })}
              className={`rounded-xl border p-4 text-left transition-colors ${
                prefs.tone === opt.id
                  ? "border-[#16a34a] bg-[#f0fdf4]"
                  : "border-[#e5e7eb] bg-white hover:border-[#bbf7d0]"
              }`}
            >
              <span className="block text-[14px] font-medium text-[#111827]">{opt.label}</span>
              <span className="mt-1 block text-[12px] text-[#6b7280]">{opt.desc}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-[13px] font-semibold text-[#111827]">AI Initiative</h2>
        <p className="mb-3 text-[13px] text-[#6b7280]">
          Насколько активно AI предлагает идеи, риски и следующие шаги
        </p>
        <div className="flex flex-wrap gap-2">
          {proactivityOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => updateAiPreferences({ proactivity: opt.id })}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                prefs.proactivity === opt.id
                  ? "bg-[#16a34a] text-white"
                  : "border border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#bbf7d0]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-5">
        <h2 className="mb-2 text-[13px] font-semibold text-[#111827]">AI OS активен</h2>
        <ul className="space-y-2 text-[13px] text-[#6b7280]">
          <li className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-[#16a34a]" />
            Контекст проектов и памяти в каждом ответе
          </li>
          <li className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-[#16a34a]" />
            Связь между чатами и artifacts
          </li>
          <li className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-[#16a34a]" />
            Прямые ответы GPT без лишних блоков
          </li>
        </ul>
      </section>
    </div>
  );
}

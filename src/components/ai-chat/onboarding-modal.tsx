"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { MultiFloraBrandLogo } from "@/components/ai-chat/multiflora-logo";
import { useWorkspace } from "@/hooks/use-workspace";
import type { UserRole } from "@/lib/workspace-types";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

const roles: { id: UserRole; label: string; desc: string }[] = [
  { id: "founder", label: "Founder", desc: "Стартапы, стратегия, рост" },
  { id: "dev", label: "Developer", desc: "Код, архитектура, отладка" },
  { id: "researcher", label: "Researcher", desc: "Анализ, источники, отчёты" },
  { id: "creator", label: "Creator", desc: "Контент, идеи, тексты" },
];

type OnboardingModalProps = {
  open: boolean;
  onComplete: () => void;
};

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { completeOnboarding, skipOnboarding } = useWorkspace();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<UserRole | null>(null);
  const [projectName, setProjectName] = useState("");

  const handleFinish = () => {
    if (!role || !projectName.trim()) return;
    completeOnboarding(role, projectName.trim());
    onComplete();
  };

  const handleSkip = () => {
    skipOnboarding();
    onComplete();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={spring}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl"
          >
            <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-6 py-5">
              <div className="flex items-center gap-3">
                <MultiFloraBrandLogo size="sm" />
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Добро пожаловать</h2>
                  <p className="text-[13px] text-[#6b7280]">Настройте workspace за 60 секунд</p>
                </div>
              </div>
              <div className="mt-4 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i <= step ? "bg-[#16a34a]" : "bg-[#e5e7eb]"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="px-6 py-6">
              {step === 0 && (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                  <p className="mb-4 text-[15px] font-medium text-[#111827]">Кто вы?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-colors",
                          role === r.id
                            ? "border-[#16a34a] bg-[#f0fdf4]"
                            : "border-[#e5e7eb] hover:border-[#bbf7d0]"
                        )}
                      >
                        <span className="block text-[14px] font-medium">{r.label}</span>
                        <span className="mt-1 block text-[12px] text-[#6b7280]">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                  <p className="mb-4 text-[15px] font-medium text-[#111827]">
                    Первый проект
                  </p>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Например: Запуск SaaS, Диплом, Контент-план…"
                    className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-[14px] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                    autoFocus
                  />
                  <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#6b7280]">
                    <Sparkles className="h-3.5 w-3.5 text-[#16a34a]" />
                    AI будет использовать контекст проекта во всех чатах
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0fdf4]">
                    <Sparkles className="h-7 w-7 text-[#16a34a]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#111827]">Готово!</h3>
                  <p className="mt-2 text-[14px] text-[#6b7280]">
                    Проект «{projectName}» создан. Начните первый диалог.
                  </p>
                </motion.div>
              )}
            </div>

            <div className="flex justify-between border-t border-[#e5e7eb] px-6 py-4">
              <button
                type="button"
                onClick={() => (step > 0 ? setStep(step - 1) : handleSkip())}
                className="text-[13px] text-[#6b7280] hover:text-[#111827]"
              >
                {step === 0 ? "Пропустить" : "Назад"}
              </button>
              <button
                type="button"
                disabled={(step === 0 && !role) || (step === 1 && !projectName.trim())}
                onClick={() => {
                  if (step < 2) setStep(step + 1);
                  else handleFinish();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#15803d] disabled:opacity-40"
              >
                {step === 2 ? "Начать" : "Далее"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

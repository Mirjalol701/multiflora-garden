"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Clapperboard,
  Download,
  ImagePlus,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type VideoStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

type VideoItem = {
  id: string;
  prompt: string;
  status: VideoStatus;
  aspectRatio: string;
  duration: string;
  videoUrl: string | null;
  sourceImageUrl: string | null;
  error: string | null;
  createdAt: string;
};

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

const aspectRatios: { id: "16:9" | "9:16" | "1:1"; label: string }[] = [
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "1:1", label: "1:1" },
];

const durations: { id: "5" | "10"; label: string }[] = [
  { id: "5", label: "5 сек" },
  { id: "10", label: "10 сек" },
];

const POLL_INTERVAL_MS = 4000;

function statusLabel(status: VideoStatus): string {
  switch (status) {
    case "IN_QUEUE":
      return "В очереди…";
    case "IN_PROGRESS":
      return "Генерируется…";
    case "COMPLETED":
      return "Готово";
    case "FAILED":
      return "Ошибка";
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

export function GenerationPanel() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<VideoItem[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<Set<string>>(new Set());

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/video");
      if (!res.ok) return;
      const data = (await res.json()) as { items: VideoItem[] };
      setItems(data.items ?? []);
    } catch {
      // ignore — panel still usable
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const pollJob = useCallback((id: string) => {
    if (pollingRef.current.has(id)) return;
    pollingRef.current.add(id);

    const tick = async () => {
      try {
        const res = await fetch(`/api/video/${id}`);
        if (!res.ok) {
          pollingRef.current.delete(id);
          return;
        }
        const updated = (await res.json()) as VideoItem;
        setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));

        if (updated.status === "COMPLETED" || updated.status === "FAILED") {
          pollingRef.current.delete(id);
          if (updated.status === "FAILED") {
            toast({
              title: "Не удалось сгенерировать видео",
              description: updated.error ?? "Попробуйте другой промпт.",
              variant: "destructive",
            });
          }
          return;
        }
        setTimeout(() => void tick(), POLL_INTERVAL_MS);
      } catch {
        pollingRef.current.delete(id);
      }
    };

    setTimeout(() => void tick(), POLL_INTERVAL_MS);
  }, []);

  useEffect(() => {
    for (const item of items) {
      if (item.status === "IN_QUEUE" || item.status === "IN_PROGRESS") {
        pollJob(item.id);
      }
    }
  }, [items, pollJob]);

  const handleImagePick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setImage(dataUrl);
    } catch (error) {
      toast({
        title: "Не удалось добавить изображение",
        description: error instanceof Error ? error.message : "Ошибка",
        variant: "destructive",
      });
    }
  };

  const canSubmit = prompt.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          duration,
          image: image ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Не удалось запустить генерацию.");
      }

      setItems((prev) => [data as VideoItem, ...prev]);
      setPrompt("");
      setImage(null);
      toast({
        title: "Генерация запущена",
        description: "Видео появится в галерее через 1–3 минуты.",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 overflow-y-auto px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#16a34a]">
          <Clapperboard className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-[#111827]">
            Генерация видео
          </h1>
          <p className="text-[12px] text-[#6b7280]">
            Текст → видео или фото → видео на движке Kling
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
        <input
          ref={imageInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            void handleImagePick(e.target.files);
            e.target.value = "";
          }}
        />

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Опишите сцену: «Медленный пролёт камеры над цветущим садом на рассвете, туман, солнечные лучи…»"
          rows={3}
          className="w-full resize-none rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 py-3 text-[14px] text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#16a34a] focus:bg-white focus:ring-2 focus:ring-[#16a34a]/20"
        />

        <AnimatePresence>
          {image && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Референс"
                  className="h-24 w-24 rounded-lg border border-[#e5e7eb] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-[#6b7280] shadow ring-1 ring-[#e5e7eb] hover:text-[#111827]"
                  aria-label="Убрать изображение"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[#6b7280]">
                Режим «фото → видео»: изображение будет оживлено
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-[#6b7280]">Формат</span>
            <div className="flex rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-0.5">
              {aspectRatios.map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  disabled={!!image}
                  onClick={() => setAspectRatio(ar.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-40",
                    aspectRatio === ar.id && !image
                      ? "bg-white text-[#16a34a] shadow-sm ring-1 ring-[#e5e7eb]"
                      : "text-[#6b7280] hover:text-[#111827]"
                  )}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-[#6b7280]">Длина</span>
            <div className="flex rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-0.5">
              {durations.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDuration(d.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    duration === d.id
                      ? "bg-white text-[#16a34a] shadow-sm ring-1 ring-[#e5e7eb]"
                      : "text-[#6b7280] hover:text-[#111827]"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6b7280] transition-colors hover:border-[#bbf7d0] hover:text-[#16a34a]"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {image ? "Заменить фото" : "Фото → видео"}
          </button>

          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit ? { scale: 0.97 } : {}}
            transition={spring}
            className={cn(
              "ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-colors",
              canSubmit ? "bg-[#16a34a] shadow-sm hover:bg-[#15803d]" : "bg-[#d1d5db]"
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" strokeWidth={2} />
            )}
            Сгенерировать
          </motion.button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-semibold text-[#111827]">
          Мои видео
        </h2>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-16 text-center">
            <Clapperboard className="h-8 w-8 text-[#d1d5db]" strokeWidth={1.5} />
            <p className="mt-3 text-[13px] text-[#6b7280]">
              Пока нет сгенерированных видео
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <VideoCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCard({ item }: { item: VideoItem }) {
  const pending = item.status === "IN_QUEUE" || item.status === "IN_PROGRESS";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm"
    >
      <div className="relative aspect-video w-full bg-[#f3f4f6]">
        {item.status === "COMPLETED" && item.videoUrl ? (
          <video
            src={item.videoUrl}
            controls
            loop
            playsInline
            className="h-full w-full object-cover"
            poster={item.sourceImageUrl ?? undefined}
          />
        ) : item.status === "FAILED" ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <AlertCircle className="h-6 w-6 text-[#ef4444]" />
            <span className="text-[12px] text-[#6b7280]">
              {item.error ?? "Ошибка генерации"}
            </span>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            {item.sourceImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.sourceImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
            )}
            <Loader2 className="relative z-10 h-6 w-6 animate-spin text-[#16a34a]" />
            <span className="relative z-10 text-[12px] font-medium text-[#6b7280]">
              {statusLabel(item.status)}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="line-clamp-2 text-[12px] text-[#374151]">{item.prompt}</p>
        <div className="mt-2 flex items-center justify-between">
          <span
            className={cn(
              "text-[11px] font-medium",
              item.status === "COMPLETED"
                ? "text-[#16a34a]"
                : item.status === "FAILED"
                  ? "text-[#ef4444]"
                  : "text-[#6b7280]"
            )}
          >
            {statusLabel(item.status)} · {item.duration} сек
          </span>
          {item.status === "COMPLETED" && item.videoUrl && (
            <a
              href={item.videoUrl}
              download
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#16a34a] hover:bg-[#f0fdf4]"
            >
              <Download className="h-3.5 w-3.5" />
              Скачать
            </a>
          )}
          {pending && (
            <span className="text-[11px] text-[#9ca3af]">≈ 1–3 мин</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

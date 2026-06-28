"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  FileText,
  ImageIcon,
  Link2,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  type ChatAttachment,
  fileToAttachment,
  linkToAttachment,
} from "@/lib/chat-attachments";

const spring = { type: "spring" as const, stiffness: 400, damping: 28 };

type AttachKind = "file" | "image" | "link" | "document";

const attachOptions: { label: string; kind: AttachKind; icon: typeof Paperclip }[] = [
  { label: "Файл", kind: "file", icon: Paperclip },
  { label: "Изображение", kind: "image", icon: ImageIcon },
  { label: "Ссылка", kind: "link", icon: Link2 },
  { label: "Документ", kind: "document", icon: FileText },
];

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachments: ChatAttachment[]) => void;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: ChatInputProps) {
  const [attachOpen, setAttachOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [processing, setProcessing] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const pendingKind = useRef<"file" | "image" | "document">("file");

  useEffect(() => {
    if (!attachOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAttachOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [attachOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled && !processing) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend =
    (value.trim().length > 0 || attachments.length > 0) && !disabled && !processing;

  const addAttachment = (att: ChatAttachment) => {
    setAttachments((prev) => [...prev, att]);
    toast({ title: "Вложение добавлено", description: att.type === "link" ? att.url : att.name });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleFilePick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      const att = await fileToAttachment(file, pendingKind.current);
      addAttachment(att);
    } catch (error) {
      toast({
        title: "Не удалось добавить файл",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setAttachOpen(false);
    }
  };

  const handleAttachOption = (kind: AttachKind) => {
    if (kind === "link") {
      setAttachOpen(false);
      setLinkOpen(true);
      return;
    }

    pendingKind.current = kind;
    if (kind === "image") {
      imageInputRef.current?.click();
    } else if (kind === "document") {
      documentInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleLinkSubmit = () => {
    try {
      const att = linkToAttachment(linkUrl);
      addAttachment(att);
      setLinkUrl("");
      setLinkOpen(false);
    } catch (error) {
      toast({
        title: "Некорректная ссылка",
        description: error instanceof Error ? error.message : "Проверьте URL",
        variant: "destructive",
      });
    }
  };

  const handleSend = () => {
    if (!canSend) return;
    onSend(attachments);
    setAttachments([]);
    setAttachOpen(false);
    setLinkOpen(false);
  };

  return (
    <div className="shrink-0 border-t border-[#e5e7eb] bg-white px-4 pb-5 pt-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".txt,.md,.json,.csv,.xml,.html,.js,.ts,.tsx,.jsx,.py,.css,.sql,.log,.yaml,.yml,.env,.ini,.toml"
        onChange={(e) => {
          void handleFilePick(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/gif,image/webp,image/*"
        onChange={(e) => {
          void handleFilePick(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={documentInputRef}
        type="file"
        className="hidden"
        accept=".txt,.md,.json,.csv,.xml,.html,.doc,.docx,.rtf,.pdf,.log"
        onChange={(e) => {
          void handleFilePick(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mx-auto max-w-3xl">
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex flex-wrap gap-2 overflow-hidden"
            >
              {attachments.map((att) => (
                <motion.div
                  key={att.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5 text-[12px] text-[#374151]"
                >
                  {att.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : att.type === "link" ? (
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
                  ) : att.type === "document" ? (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
                  ) : (
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
                  )}
                  <span className="max-w-[140px] truncate">
                    {att.type === "link" ? att.url.replace(/^https?:\/\//, "") : att.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="rounded p-0.5 text-[#9ca3af] hover:bg-[#e5e7eb] hover:text-[#111827]"
                    aria-label="Удалить вложение"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {linkOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mb-2 flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-2"
            >
              <Link2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-8 border-0 bg-transparent text-[13px] shadow-none focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                  if (e.key === "Escape") {
                    setLinkOpen(false);
                    setLinkUrl("");
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleLinkSubmit}
                className="shrink-0 rounded-lg bg-[#16a34a] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#15803d]"
              >
                Добавить
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkOpen(false);
                  setLinkUrl("");
                }}
                className="shrink-0 rounded-lg p-1.5 text-[#6b7280] hover:bg-[#e5e7eb]"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <div className="relative mb-1" ref={menuRef}>
            <motion.button
              type="button"
              aria-label="Прикрепить"
              onClick={() => setAttachOpen((v) => !v)}
              whileHover={{ scale: 1.06, rotate: attachOpen ? 45 : 0 }}
              whileTap={{ scale: 0.94 }}
              transition={spring}
              disabled={disabled || processing}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-50",
                attachOpen
                  ? "border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]"
                  : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#bbf7d0] hover:text-[#16a34a]"
              )}
            >
              <Plus className="h-4 w-4" />
            </motion.button>

            <AnimatePresence>
              {attachOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={spring}
                  className="absolute bottom-full left-0 z-50 mb-2 w-44 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white py-1 shadow-lg"
                >
                  {attachOptions.map((opt, i) => (
                    <motion.button
                      key={opt.label}
                      type="button"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring, delay: i * 0.04 }}
                      onClick={() => handleAttachOption(opt.kind)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-[#6b7280] transition-colors hover:bg-[#f0fdf4] hover:text-[#111827]"
                    >
                      <opt.icon className="h-4 w-4 text-[#16a34a]" />
                      {opt.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className={cn(
              "flex flex-1 items-end gap-2 rounded-2xl border bg-white px-2 py-2 transition-shadow",
              "border-[#e5e7eb] focus-within:border-[#16a34a] focus-within:ring-2 focus-within:ring-[#16a34a]/20"
            )}
          >
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                disabled
                  ? "Ожидание ответа..."
                  : processing
                    ? "Загрузка файла..."
                    : "Напишите сообщение..."
              }
              disabled={disabled || processing}
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[14px] text-[#111827] placeholder:text-[#6b7280] outline-none disabled:opacity-50"
            />

            <div className="flex shrink-0 items-center gap-1.5 pb-1">
              <span className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-[#15803d]">
                Zyron
              </span>

              <motion.button
                type="button"
                aria-label="Отправить"
                disabled={!canSend}
                onClick={handleSend}
                whileHover={canSend ? { scale: 1.06, backgroundColor: "#15803d" } : {}}
                whileTap={canSend ? { scale: 0.94 } : {}}
                transition={spring}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  canSend
                    ? "bg-[#16a34a] text-white shadow-sm"
                    : "bg-[#f3f4f6] text-[#6b7280]"
                )}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-3 max-w-3xl text-center text-[11px] text-[#6b7280]">
        <span className="hidden sm:inline">Enter — отправить · Shift+Enter — новая строка · </span>
        Zyron может ошибаться. Проверяйте важную информацию.
      </p>
    </div>
  );
}

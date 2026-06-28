"use client";

import { useEffect, useRef, useState } from "react";
import { History, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/components/ai-chat/chat-app";

type SearchModalProps = {
  open: boolean;
  chats: ChatSession[];
  onClose: () => void;
  onSelectChat: (id: string) => void;
};

export function SearchModal({ open, chats, onClose, onSelectChat }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setQuery("");
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

  if (!open) return null;

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/20 pt-[15vh] backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-[#6b7280]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats and projects"
            className="flex-1 bg-transparent text-[14px] text-[#111827] placeholder:text-[#6b7280] outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-1 text-[#6b7280] hover:bg-[#f0fdf4] hover:text-[#111827]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="max-h-80 overflow-y-auto py-1">
          {filtered.map((chat, i) => (
            <li key={chat.id}>
              <button
                type="button"
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  i === 0 && !query ? "bg-[#f0fdf4]" : "hover:bg-[#f0fdf4]"
                )}
              >
                <History className="h-4 w-4 shrink-0 text-[#16a34a]/60" />
                <span className="flex-1 truncate text-[13px] text-[#111827]">
                  {chat.title}
                </span>
                <span className="text-[11px] text-[#6b7280]">
                  {i === 0 && !query ? "Enter" : "Past month"}
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px] text-[#6b7280]">
              No results found
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

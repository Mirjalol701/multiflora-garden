"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type MainHeaderProps = {
  title: string;
  chats: { id: string; title: string }[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onOpenCommandPalette: () => void;
};

export function MainHeader({
  title,
  chats,
  activeChatId,
  onSelectChat,
  onOpenCommandPalette,
}: MainHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-[#e5e7eb] bg-white px-4 py-3">
      <div className="relative min-w-0 flex-1">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[14px] text-[#111827] transition-colors hover:text-[#16a34a] [&::-webkit-details-marker]:hidden">
            <span className="truncate font-medium">{title}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#6b7280] transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white py-1 shadow-lg">
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "w-full truncate px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-[#f0fdf4]",
                  activeChatId === chat.id ? "font-medium text-[#111827]" : "text-[#6b7280]"
                )}
              >
                {chat.title}
              </button>
            ))}
          </div>
        </details>
      </div>

      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="hidden items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1.5 text-[12px] text-[#6b7280] transition-colors hover:border-[#bbf7d0] hover:text-[#111827] sm:flex"
      >
        <span>Поиск</span>
        <kbd className="rounded border border-[#e5e7eb] bg-white px-1 text-[10px]">⌘K</kbd>
      </button>
    </header>
  );
}

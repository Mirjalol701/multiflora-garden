"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Code2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarMode } from "@/components/ai-chat/sidebar";

type MenuItem = {
  label: string;
  shortcut?: string;
  divider?: boolean;
  hasSubmenu?: boolean;
  action?: "newChat" | "settings";
};

type AppMenuDropdownProps = {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenCustomize: () => void;
  onModeChange: (mode: SidebarMode) => void;
};

const mainMenus = ["File", "Edit", "View", "Help"] as const;
type MainMenu = (typeof mainMenus)[number];

const submenus: Record<MainMenu, MenuItem[]> = {
  File: [
    { label: "New Conversation", shortcut: "Ctrl+N", action: "newChat" },
    { label: "Settings...", shortcut: "Ctrl+,", action: "settings" },
    { divider: true, label: "" },
    { label: "Close Window", shortcut: "Ctrl+W" },
    { label: "Exit" },
  ],
  Edit: [
    { label: "Undo", shortcut: "Ctrl+Z" },
    { label: "Redo", shortcut: "Ctrl+Shift+Z" },
    { divider: true, label: "" },
    { label: "Cut", shortcut: "Ctrl+X" },
    { label: "Copy", shortcut: "Ctrl+C" },
    { label: "Paste", shortcut: "Ctrl+V" },
    { label: "Select All", shortcut: "Ctrl+A" },
    { divider: true, label: "" },
    { label: "Find", shortcut: "Ctrl+F" },
    { label: "Find Next", shortcut: "Ctrl+G" },
    { label: "Find Previous", shortcut: "Ctrl+Shift+G" },
  ],
  View: [
    { label: "Reload", shortcut: "Ctrl+R" },
    { label: "Actual Size", shortcut: "Ctrl+0" },
    { label: "Zoom In", shortcut: "Ctrl++" },
    { label: "Zoom Out", shortcut: "Ctrl+-" },
    { label: "Copy URL" },
  ],
  Help: [
    { label: "Open Documentation" },
    { label: "Restart to update to MultiFlora 1.0.0" },
    { label: "Troubleshooting", hasSubmenu: true },
    { label: "Get Support" },
    { label: "About..." },
  ],
};

export function AppMenuDropdown({
  open,
  onClose,
  onNewChat,
  onOpenCustomize,
  onModeChange,
}: AppMenuDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<MainMenu>("File");

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  const handleItemClick = (item: MenuItem) => {
    if (item.action === "newChat") {
      onNewChat();
      onClose();
    } else if (item.action === "settings") {
      onOpenCustomize();
      onClose();
    }
  };

  return (
    <div ref={ref} className="flex items-start">
      <div className="w-44 overflow-hidden rounded-xl border border-white/[0.1] bg-[#1a2a1a] py-1 shadow-xl">
        {mainMenus.map((menu) => (
          <button
            key={menu}
            type="button"
            onMouseEnter={() => setActiveMenu(menu)}
            className={cn(
              "flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] transition-colors",
              activeMenu === menu
                ? "bg-white/[0.08] text-white/90"
                : "text-white/70 hover:bg-white/[0.05]"
            )}
          >
            {menu}
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
          </button>
        ))}
      </div>

      <div className="ml-0.5 w-56 overflow-hidden rounded-xl border border-white/[0.1] bg-[#1a2a1a] py-1 shadow-xl">
        {activeMenu === "View" && (
          <div className="flex gap-1 border-b border-white/[0.06] p-2">
            <button
              type="button"
              onClick={() => {
                onModeChange("cowork");
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] px-2 py-1.5 text-[12px] text-white/60 hover:bg-white/[0.05]"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Cowork
            </button>
            <button
              type="button"
              onClick={() => {
                onModeChange("code");
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] px-2 py-1.5 text-[12px] text-white/60 hover:bg-white/[0.05]"
            >
              <Code2 className="h-3.5 w-3.5" />
              Code
            </button>
          </div>
        )}

        {submenus[activeMenu].map((item, i) =>
          item.divider ? (
            <div key={`div-${i}`} className="my-1 border-t border-white/[0.06]" />
          ) : (
            <button
              key={item.label}
              type="button"
              onClick={() => handleItemClick(item)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white/90"
            >
              <span className="flex items-center gap-1">
                {item.label}
                {item.hasSubmenu && (
                  <ChevronRight className="h-3 w-3 text-white/30" />
                )}
              </span>
              {item.shortcut && (
                <span className="text-[11px] text-white/30">{item.shortcut}</span>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}

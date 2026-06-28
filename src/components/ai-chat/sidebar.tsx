"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  Brain,
  ChevronLeft,
  ChevronRight,
  Code2,
  FolderOpen,
  Info,
  LayoutDashboard,
  MessageSquare,
  PanelLeft,
  Plus,
  Search,
  Shapes,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiFloraBrandLogo } from "@/components/ai-chat/multiflora-logo";
import { SidebarUserFooter } from "@/components/auth/user-menu";
import { isClientAdmin } from "@/lib/admin-client";
import type { ChatSession } from "@/components/ai-chat/chat-app";

export type SidebarMode = "chat" | "cowork" | "code";
export type SidebarView = "chat" | "projects" | "artifacts" | "customize" | "memory" | "admin";

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

const modes: { id: SidebarMode; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "cowork", label: "Cowork", icon: Wand2 },
  { id: "code", label: "Code", icon: Code2 },
];

const toolsBeforeAbout: { id: SidebarView; label: string; icon: typeof Plus }[] = [
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "artifacts", label: "Artifacts", icon: Shapes },
];

const toolsAfterAbout: { id: SidebarView; label: string; icon: typeof Plus }[] = [
  { id: "memory", label: "Memory", icon: Brain },
  { id: "customize", label: "Customize", icon: Briefcase },
];

const navStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const navItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: spring },
};

const chatStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
};

const chatItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

type ChatSidebarProps = {
  chats: ChatSession[];
  activeChatId: string | null;
  activeMode: SidebarMode;
  activeView: SidebarView;
  sidebarOpen: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  memoryCount?: number;
  onModeChange: (mode: SidebarMode) => void;
  onViewChange: (view: SidebarView) => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  aboutOpen: boolean;
  onOpenAbout: () => void;
  onOpenAdmin: () => void;
};

function IconButton({
  children,
  onClick,
  disabled,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? {} : { scale: 1.06 }}
      whileTap={disabled ? {} : { scale: 0.94 }}
      className={cn(
        "rounded-lg p-2 transition-colors",
        active
          ? "bg-[#f0fdf4] text-[#16a34a]"
          : "text-[#6b7280] hover:bg-[#f0fdf4] hover:text-[#111827]",
        disabled && "cursor-not-allowed opacity-25"
      )}
    >
      {children}
    </motion.button>
  );
}

function NavItem({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Plus;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2.5 text-[13px] transition-colors",
        active ? "bg-[#f0fdf4]" : "hover:bg-[#f0fdf4]"
      )}
    >
      <span
        className={cn(
          "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[#16a34a] transition-opacity",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
        )}
      />
      <Icon
        className={cn(
          "relative z-10 h-4 w-4 shrink-0 transition-colors",
          active ? "text-[#16a34a]" : "text-[#6b7280] group-hover:text-[#16a34a]"
        )}
        strokeWidth={1.75}
      />
      <span
        className={cn(
          "relative z-10 truncate transition-colors",
          active ? "font-medium text-[#111827]" : "text-[#6b7280] group-hover:text-[#111827]"
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}

export function ChatSidebar({
  chats,
  activeChatId,
  activeMode,
  activeView,
  sidebarOpen,
  canGoBack,
  canGoForward,
  memoryCount = 0,
  onModeChange,
  onViewChange,
  onNewChat,
  onSelectChat,
  onToggleSidebar,
  onOpenCommandPalette,
  onNavigateBack,
  onNavigateForward,
  aboutOpen,
  onOpenAbout,
  onOpenAdmin,
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const isAdmin = isClientAdmin(session?.user);

  const openChat = () => {
    onViewChange("chat");
    onNewChat();
  };

  const selectChat = (id: string) => {
    onViewChange("chat");
    onSelectChat(id);
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={spring}
          className="relative flex h-full w-[272px] shrink-0 flex-col border-r border-[#e5e7eb] bg-[#f9fafb]"
        >
          <div className="relative flex items-center gap-0.5 px-2.5 py-2.5">
            <IconButton label="Toggle sidebar" onClick={onToggleSidebar}>
              <PanelLeft className="h-4 w-4" />
            </IconButton>
            <IconButton label="Командная палитра" onClick={onOpenCommandPalette}>
              <Search className="h-4 w-4" />
            </IconButton>
            <div className="ml-auto flex items-center">
              <IconButton label="Back" disabled={!canGoBack} onClick={onNavigateBack}>
                <ChevronLeft className="h-4 w-4" />
              </IconButton>
              <IconButton label="Forward" disabled={!canGoForward} onClick={onNavigateForward}>
                <ChevronRight className="h-4 w-4" />
              </IconButton>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.05 }}
            className="flex items-center gap-3 px-4 pb-4 pt-1"
          >
            <MultiFloraBrandLogo size="sm" className="shadow-sm" />
            <div className="min-w-0">
              <span className="block text-[15px] font-bold tracking-tight text-[#111827]">
                MultiFlora <span className="font-semibold text-[#6b7280]">AI</span>
              </span>
              <span className="block text-[10px] tracking-wide text-[#6b7280]">
                powered by Mirjalol
              </span>
            </div>
          </motion.div>

          <div className="px-3 pb-3">
            <div className="flex rounded-lg border border-[#e5e7eb] bg-white p-1">
              {modes.map((mode) => (
                <motion.button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onModeChange(mode.id);
                    onViewChange("chat");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-1 py-2 text-[11px] font-medium transition-all",
                    activeMode === mode.id
                      ? "text-[#111827]"
                      : "text-[#6b7280] hover:text-[#111827]"
                  )}
                >
                  {activeMode === mode.id && (
                    <motion.span
                      layoutId="mode-pill"
                      className="absolute inset-0 rounded-md bg-[#f0fdf4] ring-1 ring-[#e5e7eb]"
                      transition={spring}
                    />
                  )}
                  <mode.icon className="relative z-10 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="relative z-10 truncate">{mode.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="px-3 pb-2">
            <motion.button
              type="button"
              onClick={openChat}
              whileHover={{ scale: 1.02, backgroundColor: "#15803d" }}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              New Chat
            </motion.button>
          </div>

          <motion.nav
            variants={navStagger}
            initial="hidden"
            animate="show"
            className="space-y-0.5 px-2"
          >
            <motion.div variants={navItem}>
              <NavItem
                active={activeView === "chat" && activeChatId === null}
                onClick={openChat}
                icon={MessageSquare}
                label="Chat"
              />
            </motion.div>
            {toolsBeforeAbout.map((tool) => (
              <motion.div key={tool.id} variants={navItem}>
                <NavItem
                  active={activeView === tool.id}
                  onClick={() => onViewChange(tool.id)}
                  icon={tool.icon}
                  label={tool.label}
                />
              </motion.div>
            ))}
            <motion.div variants={navItem}>
              <NavItem
                active={aboutOpen}
                onClick={onOpenAbout}
                icon={Info}
                label="О нас"
              />
            </motion.div>
            {toolsAfterAbout.map((tool) => (
              <motion.div key={tool.id} variants={navItem}>
                <NavItem
                  active={activeView === tool.id}
                  onClick={() => onViewChange(tool.id)}
                  icon={tool.icon}
                  label={
                    tool.id === "memory" && memoryCount > 0
                      ? `${tool.label} (${memoryCount})`
                      : tool.label
                  }
                />
              </motion.div>
            ))}
            {isAdmin && (
              <motion.div variants={navItem}>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className={cn(
                    "relative mt-2 flex w-full items-center gap-2.5 overflow-hidden rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors",
                    activeView === "admin"
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-green-500/40 bg-[#f0fdf4] text-[#15803d] hover:border-green-500 hover:bg-[#dcfce7]"
                  )}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>Админ-панель</span>
                </button>
              </motion.div>
            )}
          </motion.nav>

          <div className="mt-4 flex-1 overflow-y-auto px-2">
            <p className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
              Recents
            </p>
            <motion.ul variants={chatStagger} initial="hidden" animate="show" className="space-y-0.5">
              {chats.map((chat) => (
                <motion.li key={chat.id} variants={chatItem}>
                  <motion.button
                    type="button"
                    onClick={() => selectChat(chat.id)}
                    whileHover={{ x: 1 }}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-lg py-2 pl-3 pr-2.5 text-left transition-colors",
                      activeView === "chat" && activeChatId === chat.id
                        ? "bg-[#f0fdf4]"
                        : "hover:bg-[#f0fdf4]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[#16a34a]",
                        activeView === "chat" && activeChatId === chat.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-60"
                      )}
                    />
                    <span
                      className={cn(
                        "block truncate text-[13px] transition-colors",
                        activeView === "chat" && activeChatId === chat.id
                          ? "font-medium text-[#111827]"
                          : "text-[#6b7280] group-hover:text-[#111827]"
                      )}
                    >
                      {chat.title}
                    </span>
                  </motion.button>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <SidebarUserFooter onOpenAdmin={onOpenAdmin} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

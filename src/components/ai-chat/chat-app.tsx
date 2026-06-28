"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft } from "lucide-react";
import {
  ChatSidebar,
  type SidebarMode,
  type SidebarView,
} from "@/components/ai-chat/sidebar";
import { WelcomeScreen } from "@/components/ai-chat/welcome-screen";
import { ChatMessages } from "@/components/ai-chat/chat-messages";
import { ChatInput } from "@/components/ai-chat/chat-input";
import { CommandPalette } from "@/components/ai-chat/command-palette";
import { AboutModal } from "@/components/ai-chat/about-modal";
import { MainHeader } from "@/components/ai-chat/main-header";
import { ProjectsPanel } from "@/components/ai-chat/projects-panel";
import { ArtifactsPanel } from "@/components/ai-chat/artifacts-panel";
import { MemoryInbox } from "@/components/ai-chat/memory-inbox";
import { ArtifactSplitPanel } from "@/components/ai-chat/artifact-split-panel";
import { OnboardingModal } from "@/components/ai-chat/onboarding-modal";
import { ContextBar } from "@/components/ai-chat/context-bar";
import dynamic from "next/dynamic";
import { CustomizePanel } from "@/components/ai-chat/customize-panel";

const AdminDashboard = dynamic(
  () =>
    import("@/components/admin/admin-dashboard").then((m) => m.AdminDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a] p-8">
        <p className="text-[#71717a]">Загрузка админ-панели…</p>
      </div>
    ),
  }
);
import { formatGeminiUserError } from "@/lib/ai-errors";
import { streamAgentReply } from "@/lib/agent-stream";
import type { AgentSSEEvent } from "@/lib/agent-events";
import {
  buildThinkingStateFromEvent,
  type ThinkingState,
} from "@/components/ai-chat/thinking-panel";
import { buildAgentWorkspacePayload } from "@/lib/agent-workspace-payload";
import {
  buildMessageWithAttachments,
  extractImageAttachments,
  type ChatAttachment,
} from "@/lib/chat-attachments";
import { createId } from "@/lib/workspace-storage";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/hooks/use-toast";
import type { WorkspaceChat } from "@/lib/workspace-types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

const spring = { type: "spring" as const, stiffness: 320, damping: 32 };

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function trimmedFallback(history: ChatMessage[]): string {
  return history[history.length - 1]?.content ?? "";
}

type NavState = {
  past: (string | null)[];
  future: (string | null)[];
};

export function ChatApp() {
  const {
    state,
    ready,
    activeArtifactId,
    setActiveArtifactId,
    setActiveProjectId,
    createArtifact,
    addMemoryCandidate,
    upsertChat,
    extractMemoriesFromReply,
  } = useWorkspace();

  const chats: ChatSession[] = useMemo(
    () =>
      state.chats.map((c) => ({
        id: c.id,
        title: c.title,
        messages: c.messages,
      })),
    [state.chats]
  );

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<SidebarMode>("chat");
  const [activeView, setActiveView] = useState<SidebarView>("chat");
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingState, setThinkingState] = useState<ThinkingState | null>(null);
  const [nav, setNav] = useState<NavState>({ past: [], future: [] });

  useEffect(() => {
    if (!ready) return;
    setOnboardingOpen(!state.onboardingCompleted);
  }, [ready, state.onboardingCompleted]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "admin") {
      setAboutOpen(false);
      setOnboardingOpen(false);
      setActiveView("admin");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleOpenAdmin = useCallback(() => {
    setAboutOpen(false);
    setOnboardingOpen(false);
    setActiveView("admin");
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const hasMessages = (activeChat?.messages.length ?? 0) > 0;
  const isChatView = activeView === "chat";
  const isAdminView = activeView === "admin";

  const syncChat = useCallback(
    (chat: WorkspaceChat) => {
      upsertChat(chat);
    },
    [upsertChat]
  );

  const navigateTo = useCallback((chatId: string | null) => {
    setActiveChatId((current) => {
      if (current !== chatId) {
        setNav((n) => ({
          past: [...n.past, current],
          future: [],
        }));
      }
      return chatId;
    });
    setActiveView("chat");
    setInput("");
  }, []);

  const handleNewChat = useCallback(() => {
    navigateTo(null);
  }, [navigateTo]);

  const handleSelectChat = (id: string) => {
    navigateTo(id);
  };

  const handleStartProjectChat = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveView("chat");
    navigateTo(null);
  };

  const handleNavigateBack = () => {
    if (nav.past.length === 0) return;
    const prev = nav.past[nav.past.length - 1];
    setNav({
      past: nav.past.slice(0, -1),
      future: [activeChatId, ...nav.future],
    });
    setActiveChatId(prev);
    setActiveView("chat");
  };

  const handleNavigateForward = () => {
    if (nav.future.length === 0) return;
    const next = nav.future[0];
    setNav({
      past: [...nav.past, activeChatId],
      future: nav.future.slice(1),
    });
    setActiveChatId(next);
    setActiveView("chat");
  };

  const getWorkspaceChat = (chatId: string): WorkspaceChat | undefined =>
    state.chats.find((c) => c.id === chatId);

  const runAiReply = useCallback(
    async (
      chatId: string,
      history: ChatMessage[],
      chatTitle: string,
      imageAttachments: ReturnType<typeof extractImageAttachments> = []
    ) => {
      const assistantId = `${Date.now()}-a`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };
      const withAssistant = [...history, assistantMsg];

      const existing = getWorkspaceChat(chatId);
      syncChat({
        id: chatId,
        title: chatTitle,
        messages: withAssistant,
        projectId: existing?.projectId ?? state.activeProjectId,
        mode: activeMode,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });

      setIsLoading(true);
      setIsStreaming(false);
      setThinkingState(null);

      const lastUser = [...history].reverse().find((m) => m.role === "user");
      const priorHistory = lastUser
        ? history.slice(0, history.lastIndexOf(lastUser))
        : history;

      const projectId = existing?.projectId ?? state.activeProjectId;
      const assistantDraft = { content: "", imageUrl: undefined as string | undefined };

      const syncAssistant = () => {
        syncChat({
          id: chatId,
          title: chatTitle,
          messages: withAssistant.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: assistantDraft.content,
                  imageUrl: assistantDraft.imageUrl,
                }
              : m
          ),
          projectId,
          mode: activeMode,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        });
      };

      const applyText = (text: string) => {
        setIsLoading(false);
        setIsStreaming(true);
        assistantDraft.content = text;
        syncAssistant();
      };

      try {
        const full = await streamAgentReply(
          {
            chatId,
            projectId,
            message: lastUser?.content ?? trimmedFallback(history),
            mode: activeMode,
            history: priorHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            workspace: buildAgentWorkspacePayload(state),
            imageAttachments,
          },
          {
            onText: applyText,
            onEvent: (event: AgentSSEEvent) => {
              setThinkingState((prev) => buildThinkingStateFromEvent(prev, event));

              if (event.type === "image_generated") {
                assistantDraft.imageUrl = event.dataUrl;
                syncAssistant();
              }

              if (event.type === "artifact_created") {
                createArtifact({
                  title: event.title,
                  content: event.content,
                  type: event.artifactType as "document" | "code" | "plan",
                  chatId,
                });
                toast({
                  title: "Artifact создан",
                  description: event.title,
                });
              }

              if (event.type === "memory_candidate") {
                addMemoryCandidate(event.content, chatTitle);
              }
            },
          }
        );

        if (lastUser) {
          extractMemoriesFromReply(lastUser.content, full, chatTitle);
        }
      } catch (error) {
        const raw =
          error instanceof Error
            ? error.message
            : "Не удалось получить ответ от AI.";
        const errorText = `⚠️ ${formatGeminiUserError(raw)}`;
        syncChat({
          id: chatId,
          title: chatTitle,
          messages: withAssistant.map((m) =>
            m.id === assistantId ? { ...m, content: errorText } : m
          ),
          projectId: existing?.projectId ?? state.activeProjectId,
          mode: activeMode,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setThinkingState(null);
      }
    },
    [
      activeMode,
      addMemoryCandidate,
      createArtifact,
      extractMemoriesFromReply,
      state,
      syncChat,
    ]
  );

  const sendMessage = async (text: string, attachments: ChatAttachment[] = []) => {
    const trimmed = buildMessageWithAttachments(text, attachments);
    if (!trimmed || isLoading || isStreaming) return;

    setActiveView("chat");
    setInput("");

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      content: trimmed,
    };

    let chatId = activeChatId;
    let history: ChatMessage[] = [];
    let title = activeChat?.title ?? "New chat";

    if (!chatId) {
      chatId = createId();
      const titleSource =
        text.trim() ||
        (attachments[0]?.type === "link"
          ? attachments[0].url
          : attachments[0]?.name) ||
        trimmed;
      title = titleSource.length > 32 ? `${titleSource.slice(0, 32)}…` : titleSource;
      history = [userMsg];
      syncChat({
        id: chatId,
        title,
        messages: history,
        projectId: state.activeProjectId,
        mode: activeMode,
        createdAt: new Date().toISOString(),
      });
      navigateTo(chatId);
    } else {
      history = [...(activeChat?.messages ?? []), userMsg];
      syncChat({
        id: chatId,
        title,
        messages: history,
        projectId: getWorkspaceChat(chatId)?.projectId ?? state.activeProjectId,
        mode: activeMode,
        createdAt: getWorkspaceChat(chatId)?.createdAt ?? new Date().toISOString(),
      });
    }

    await runAiReply(chatId, history, title, extractImageAttachments(attachments));
  };

  const regenerateLastReply = useCallback(async () => {
    if (!activeChatId || isLoading || isStreaming) return;

    const chat = chats.find((c) => c.id === activeChatId);
    if (!chat) return;

    let lastAssistantIndex = -1;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      if (chat.messages[i].role === "assistant") {
        lastAssistantIndex = i;
        break;
      }
    }
    if (lastAssistantIndex === -1) return;

    const history = chat.messages.slice(0, lastAssistantIndex);
    if (history.length === 0 || history[history.length - 1].role !== "user") return;

    syncChat({
      ...getWorkspaceChat(activeChatId)!,
      messages: history,
    });

    await runAiReply(activeChatId, history, chat.title);
  }, [activeChatId, chats, isLoading, isStreaming, runAiReply, syncChat, state.chats]);

  const handleSaveArtifact = (content: string) => {
    const title =
      content.slice(0, 48).replace(/\n/g, " ").trim() + (content.length > 48 ? "…" : "");
    createArtifact({
      title: title || "Artifact",
      content,
      chatId: activeChatId ?? undefined,
    });
    toast({ title: "Сохранено как Artifact", description: "Откройте панель справа" });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "n") {
        e.preventDefault();
        handleNewChat();
      }
      if (mod && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleNewChat]);

  const chatTitle =
    activeChat?.title ??
    (activeMode === "cowork" ? "Cowork" : activeMode === "code" ? "Code" : "New chat");

  const mainKey = `${activeView}-${activeChatId ?? "new"}-${hasMessages}`;

  const renderMain = () => {
    if (activeView === "projects") {
      return <ProjectsPanel onStartChat={handleStartProjectChat} />;
    }
    if (activeView === "artifacts") {
      return (
        <ArtifactsPanel
          onOpenArtifact={(id) => {
            setActiveArtifactId(id);
            setActiveView("chat");
          }}
        />
      );
    }
    if (activeView === "memory") {
      return <MemoryInbox />;
    }
    if (activeView === "customize") {
      return <CustomizePanel />;
    }

    if (!activeChatId || !hasMessages) {
      return (
        <WelcomeScreen mode={activeMode} onSuggestionClick={(q) => sendMessage(q)} />
      );
    }

    return (
      <ChatMessages
        messages={activeChat!.messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        thinkingState={thinkingState}
        onRegenerate={regenerateLastReply}
        onSaveArtifact={handleSaveArtifact}
      />
    );
  };

  return (
    <div className="ai-landing ai-main-bg relative flex h-screen overflow-hidden text-[#111827]">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        activeMode={activeMode}
        activeView={activeView}
        sidebarOpen={sidebarOpen}
        canGoBack={nav.past.length > 0}
        canGoForward={nav.future.length > 0}
        memoryCount={state.memories.filter((m) => m.status === "PENDING").length}
        onModeChange={setActiveMode}
        onViewChange={(view) => {
          setAboutOpen(false);
          setActiveView(view);
        }}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onOpenCommandPalette={() => setCommandOpen(true)}
        onNavigateBack={handleNavigateBack}
        onNavigateForward={handleNavigateForward}
        aboutOpen={aboutOpen}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenAdmin={handleOpenAdmin}
      />

      <div className="flex min-w-0 flex-1">
        <div
          className={
            isAdminView
              ? "flex min-w-0 flex-1 flex-col bg-[#0a0a0a]"
              : "flex min-w-0 flex-1 flex-col bg-white"
          }
        >
          {!sidebarOpen && (
            <div className="relative flex items-center gap-0.5 border-b border-[#e5e7eb] bg-white px-2 py-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f0fdf4] hover:text-[#111827]"
                aria-label="Открыть боковую панель"
              >
                <PanelLeft className="h-4 w-4" />
              </motion.button>
            </div>
          )}

          {isChatView && (
            <MainHeader
              title={chatTitle}
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              onOpenCommandPalette={() => setCommandOpen(true)}
            />
          )}

          {isChatView && (
            <ContextBar onOpenMemory={() => setActiveView("memory")} />
          )}

          {isAdminView ? (
            <main className="flex-1 overflow-y-auto">
              <AdminDashboard />
            </main>
          ) : (
            <AnimatePresence mode="wait">
              <motion.main
                key={mainKey}
                initial={pageTransition.initial}
                animate={pageTransition.animate}
                exit={pageTransition.exit}
                transition={spring}
                className="flex-1 overflow-y-auto"
              >
                {renderMain()}
              </motion.main>
            </AnimatePresence>
          )}

          {isChatView && (
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={(attachments) => sendMessage(input, attachments)}
              disabled={isLoading || isStreaming}
            />
          )}
        </div>

        {activeArtifactId && isChatView && <ArtifactSplitPanel />}
      </div>

      <CommandPalette
        open={commandOpen}
        chats={chats}
        projects={state.projects}
        artifacts={state.artifacts}
        memories={state.memories}
        onClose={() => setCommandOpen(false)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onNavigate={(view) => {
          setAboutOpen(false);
          setActiveView(view);
        }}
        onOpenAbout={() => setAboutOpen(true)}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setActiveView("projects");
        }}
        onSelectArtifact={(id) => {
          setActiveArtifactId(id);
          setActiveView("chat");
        }}
        onOpenMemory={() => setActiveView("memory")}
      />

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <OnboardingModal
        open={onboardingOpen && !isAdminView}
        onComplete={() => setOnboardingOpen(false)}
      />
    </div>
  );
}

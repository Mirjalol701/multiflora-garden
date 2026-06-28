"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  createId,
  createShareToken,
  loadWorkspace,
  saveWorkspace,
} from "@/lib/workspace-storage";
import {
  EMPTY_WORKSPACE,
  type AiPreferences,
  type ArtifactType,
  type UserRole,
  type WorkspaceArtifact,
  type WorkspaceChat,
  type WorkspaceMemory,
  type WorkspaceProject,
  type WorkspaceState,
} from "@/lib/workspace-types";
import { publishArtifactShare, syncWorkspaceToDb, loadWorkspaceFromDb, completeOnboarding as completeOnboardingDb, skipOnboarding as skipOnboardingDb } from "@/actions/workspace";
import { indexMemoryEmbedding } from "@/actions/memory";
import { mergeWorkspace } from "@/lib/workspace-utils";

type WorkspaceContextValue = {
  state: WorkspaceState;
  ready: boolean;
  activeProject: WorkspaceProject | null;
  approvedMemories: WorkspaceMemory[];
  activeArtifactId: string | null;
  setActiveArtifactId: (id: string | null) => void;
  createProject: (data: { name: string; description?: string; instructions?: string }) => string;
  updateProject: (id: string, data: Partial<WorkspaceProject>) => void;
  deleteProject: (id: string) => void;
  setActiveProjectId: (id: string | null) => void;
  createArtifact: (data: {
    title: string;
    content: string;
    type?: ArtifactType;
    chatId?: string;
  }) => string;
  updateArtifact: (id: string, data: Partial<WorkspaceArtifact>) => void;
  deleteArtifact: (id: string) => void;
  shareArtifact: (id: string) => Promise<string | null>;
  addMemoryCandidate: (content: string, source?: string) => void;
  updateMemoryStatus: (id: string, status: WorkspaceMemory["status"]) => void;
  deleteMemory: (id: string) => void;
  completeOnboarding: (role: UserRole, projectName: string, instructions?: string) => void;
  skipOnboarding: () => void;
  upsertChat: (chat: WorkspaceChat) => void;
  removeChat: (id: string) => void;
  extractMemoriesFromReply: (userMsg: string, assistantMsg: string, source: string) => void;
  updateAiPreferences: (prefs: Partial<AiPreferences>) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function persist(state: WorkspaceState) {
  saveWorkspace(state);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [state, setState] = useState<WorkspaceState>(EMPTY_WORKSPACE);
  const [ready, setReady] = useState(false);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);

  useEffect(() => {
    setState(loadWorkspace());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!session?.user?.id || !ready) return;
    loadWorkspaceFromDb()
      .then((remote) => {
        if (!remote) return;
        setState((prev) => mergeWorkspace(prev, remote));
      })
      .catch(() => undefined);
  }, [session?.user?.id, ready]);

  useEffect(() => {
    if (!ready) return;
    persist(state);
  }, [state, ready]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const timer = setTimeout(() => {
      void syncWorkspaceToDb({
        projects: state.projects,
        chats: state.chats,
        artifacts: state.artifacts,
        memories: state.memories,
      }).catch(() => undefined);
    }, 2000);
    return () => clearTimeout(timer);
  }, [session?.user?.id, state]);

  const update = useCallback((fn: (prev: WorkspaceState) => WorkspaceState) => {
    setState((prev) => fn(prev));
  }, []);

  const activeProject = useMemo(
    () => state.projects.find((p) => p.id === state.activeProjectId) ?? null,
    [state.projects, state.activeProjectId]
  );

  const approvedMemories = useMemo(
    () => state.memories.filter((m) => m.status === "APPROVED"),
    [state.memories]
  );

  const createProject = useCallback(
    (data: { name: string; description?: string; instructions?: string }) => {
      const id = createId();
      update((prev) => ({
        ...prev,
        projects: [
          {
            id,
            name: data.name,
            description: data.description,
            instructions: data.instructions,
            color: "#16a34a",
            createdAt: new Date().toISOString(),
          },
          ...prev.projects,
        ],
        activeProjectId: id,
      }));
      return id;
    },
    [update]
  );

  const updateProject = useCallback(
    (id: string, data: Partial<WorkspaceProject>) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      }));
    },
    [update]
  );

  const deleteProject = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
        activeProjectId: prev.activeProjectId === id ? null : prev.activeProjectId,
        chats: prev.chats.map((c) =>
          c.projectId === id ? { ...c, projectId: null } : c
        ),
      }));
    },
    [update]
  );

  const setActiveProjectId = useCallback(
    (id: string | null) => {
      update((prev) => ({ ...prev, activeProjectId: id }));
    },
    [update]
  );

  const createArtifact = useCallback(
    (data: {
      title: string;
      content: string;
      type?: ArtifactType;
      chatId?: string;
    }) => {
      const id = createId();
      update((prev) => ({
        ...prev,
        artifacts: [
          {
            id,
            title: data.title,
            content: data.content,
            type: data.type ?? "document",
            projectId: prev.activeProjectId,
            chatId: data.chatId ?? null,
            shareToken: null,
            isPublic: false,
            version: 1,
            createdAt: new Date().toISOString(),
          },
          ...prev.artifacts,
        ],
      }));
      setActiveArtifactId(id);
      return id;
    },
    [update]
  );

  const updateArtifact = useCallback(
    (id: string, data: Partial<WorkspaceArtifact>) => {
      update((prev) => ({
        ...prev,
        artifacts: prev.artifacts.map((a) =>
          a.id === id ? { ...a, ...data, version: (a.version ?? 1) + (data.content ? 1 : 0) } : a
        ),
      }));
    },
    [update]
  );

  const deleteArtifact = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        artifacts: prev.artifacts.filter((a) => a.id !== id),
      }));
      setActiveArtifactId((cur) => (cur === id ? null : cur));
    },
    [update]
  );

  const shareArtifact = useCallback(
    async (id: string) => {
      const artifact = state.artifacts.find((a) => a.id === id);
      if (!artifact) return null;

      if (artifact.shareToken) {
        return artifact.shareToken;
      }

      try {
        const { token } = await publishArtifactShare({
          title: artifact.title,
          content: artifact.content,
          type: artifact.type,
        });
        update((prev) => ({
          ...prev,
          artifacts: prev.artifacts.map((a) =>
            a.id === id ? { ...a, shareToken: token, isPublic: true } : a
          ),
        }));
        return token;
      } catch {
        const token = createShareToken();
        update((prev) => ({
          ...prev,
          artifacts: prev.artifacts.map((a) =>
            a.id === id ? { ...a, shareToken: token, isPublic: true } : a
          ),
        }));
        return token;
      }
    },
    [state.artifacts, update]
  );

  const addMemoryCandidate = useCallback(
    (content: string, source?: string) => {
      const id = createId();
      update((prev) => ({
        ...prev,
        memories: [
          {
            id,
            content,
            status: "PENDING",
            projectId: prev.activeProjectId,
            source,
            createdAt: new Date().toISOString(),
          },
          ...prev.memories,
        ],
      }));
    },
    [update]
  );

  const updateMemoryStatus = useCallback(
    (id: string, status: WorkspaceMemory["status"]) => {
      update((prev) => {
        const memory = prev.memories.find((m) => m.id === id);
        if (status === "APPROVED" && memory) {
          void indexMemoryEmbedding({
            memoryId: id,
            content: memory.content,
            projectId: memory.projectId,
          });
        }
        return {
          ...prev,
          memories: prev.memories.map((m) => (m.id === id ? { ...m, status } : m)),
        };
      });
    },
    [update]
  );

  const deleteMemory = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        memories: prev.memories.filter((m) => m.id !== id),
      }));
    },
    [update]
  );

  const completeOnboarding = useCallback(
    (role: UserRole, projectName: string, instructions?: string) => {
      createProject({ name: projectName, instructions });
      update((prev) => ({
        ...prev,
        onboardingCompleted: true,
        userRole: role,
      }));
      if (session?.user?.id) {
        void completeOnboardingDb({
          userRole: role,
          projectName,
          projectInstructions: instructions,
        });
      }
    },
    [createProject, update, session?.user?.id]
  );

  const skipOnboarding = useCallback(() => {
    update((prev) => ({
      ...prev,
      onboardingCompleted: true,
    }));
    if (session?.user?.id) {
      void skipOnboardingDb();
    }
  }, [update, session?.user?.id]);

  const upsertChat = useCallback((chat: WorkspaceChat) => {
    update((prev) => {
      const exists = prev.chats.some((c) => c.id === chat.id);
      return {
        ...prev,
        chats: exists
          ? prev.chats.map((c) => (c.id === chat.id ? chat : c))
          : [chat, ...prev.chats],
      };
    });
  }, [update]);

  const removeChat = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        chats: prev.chats.filter((c) => c.id !== id),
      }));
    },
    [update]
  );

  const extractMemoriesFromReply = useCallback(
    (userMsg: string, assistantMsg: string, source: string) => {
      const candidates: string[] = [];

      const preferencePatterns = [
        /(?:я\s+)?(?:предпочитаю|prefer|люблю|обычно)\s+([^.!?\n]{5,100})/i,
        /(?:мой|моя|моё|my|наш|наша)\s+(.{5,80}?)\s+(?:—|-|:)/i,
        /(?:цель|goal|задача|task)[:\s]+([^.!?\n]{5,120})/i,
        /(?:решили|decided|выбираем|будем использовать)\s+([^.!?\n]{5,120})/i,
      ];

      for (const pattern of preferencePatterns) {
        const match = userMsg.match(pattern);
        if (match?.[1]) {
          candidates.push(match[1].trim());
        }
      }

      if (candidates.length > 0) {
        for (const c of candidates.slice(0, 2)) {
          addMemoryCandidate(c, source);
        }
        return;
      }

      const decisionMatch = assistantMsg.match(
        /(?:рекомендую|рекомендация|итог|вывод|decision|рекомендуется)[:\s]+([^.!?\n]{10,150})/i
      );
      if (decisionMatch?.[1] && userMsg.length > 20) {
        addMemoryCandidate(`Решение: ${decisionMatch[1].trim()}`, source);
        return;
      }

      if (userMsg.length > 30 && assistantMsg.length > 300) {
        addMemoryCandidate(`Тема «${source}»: ${userMsg.slice(0, 100).trim()}`, source);
      }
    },
    [addMemoryCandidate]
  );

  const updateAiPreferences = useCallback(
    (prefs: Partial<AiPreferences>) => {
      update((prev) => ({
        ...prev,
        aiPreferences: { ...prev.aiPreferences, ...prefs },
      }));
    },
    [update]
  );

  const value = useMemo(
    () => ({
      state,
      ready,
      activeProject,
      approvedMemories,
      activeArtifactId,
      setActiveArtifactId,
      createProject,
      updateProject,
      deleteProject,
      setActiveProjectId,
      createArtifact,
      updateArtifact,
      deleteArtifact,
      shareArtifact,
      addMemoryCandidate,
      updateMemoryStatus,
      deleteMemory,
      completeOnboarding,
      skipOnboarding,
      upsertChat,
      removeChat,
      extractMemoriesFromReply,
      updateAiPreferences,
    }),
    [
      state,
      ready,
      activeProject,
      approvedMemories,
      activeArtifactId,
      createProject,
      updateProject,
      deleteProject,
      setActiveProjectId,
      createArtifact,
      updateArtifact,
      deleteArtifact,
      shareArtifact,
      addMemoryCandidate,
      updateMemoryStatus,
      deleteMemory,
      completeOnboarding,
      skipOnboarding,
      upsertChat,
      removeChat,
      extractMemoriesFromReply,
      updateAiPreferences,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

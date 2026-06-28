import {
  DEFAULT_AI_PREFERENCES,
  EMPTY_WORKSPACE,
  type WorkspaceState,
} from "@/lib/workspace-types";

const STORAGE_KEY = "multiflora-workspace-v1";

export function loadWorkspace(): WorkspaceState {
  if (typeof window === "undefined") return EMPTY_WORKSPACE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_WORKSPACE;
    const parsed = JSON.parse(raw) as WorkspaceState;
    return {
      ...EMPTY_WORKSPACE,
      ...parsed,
      aiPreferences: { ...DEFAULT_AI_PREFERENCES, ...parsed.aiPreferences },
      // Если уже есть проекты — onboarding считаем пройденным
      onboardingCompleted:
        parsed.onboardingCompleted ||
        (Array.isArray(parsed.projects) && parsed.projects.length > 0),
    };
  } catch {
    return EMPTY_WORKSPACE;
  }
}

export function saveWorkspace(state: WorkspaceState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Large generated images can exceed quota — save without image blobs
    const trimmed: WorkspaceState = {
      ...state,
      chats: state.chats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((m) => {
          const { imageUrl: _, ...rest } = m;
          return rest;
        }),
      })),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore — in-memory state still works for current session
    }
  }
}

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export { createShareToken } from "@/lib/share-token";

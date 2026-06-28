import type { WorkspaceState } from "@/lib/workspace-types";
import type { WorkspaceSnapshot } from "@/server/agent/types";

/** Trim workspace for API requests — avoids oversized JSON bodies. */
export function buildAgentWorkspacePayload(
  state: Pick<
    WorkspaceState,
    "projects" | "chats" | "artifacts" | "memories" | "userRole" | "aiPreferences"
  >
): WorkspaceSnapshot {
  return {
    projects: state.projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      instructions: p.instructions,
      color: p.color,
    })),
    chats: state.chats.map((c) => ({
      id: c.id,
      title: c.title,
      projectId: c.projectId,
      messages: c.messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content.slice(0, 4000),
      })),
    })),
    artifacts: state.artifacts.slice(0, 20).map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content.slice(0, 2000),
      type: a.type,
      projectId: a.projectId,
    })),
    memories: state.memories.slice(0, 50).map((m) => ({
      id: m.id,
      content: m.content.slice(0, 1000),
      status: m.status,
      projectId: m.projectId,
    })),
    userRole: state.userRole,
    aiPreferences: state.aiPreferences,
  };
}

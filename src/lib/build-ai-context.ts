import type { AiWorkspaceContext } from "@/lib/zyron-prompt";
import type { WorkspaceState } from "@/lib/workspace-types";

const EXCERPT_LEN = 180;
const MAX_RELATED_CHATS = 4;
const MAX_ARTIFACTS = 4;
const MAX_OTHER_PROJECTS = 3;

function excerpt(text: string, max = EXCERPT_LEN): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

function chatSummary(messages: { role: string; content: string }[]): string {
  const last = [...messages].reverse().find((m) => m.content.trim());
  if (!last) return "пустой чат";
  const prefix = last.role === "user" ? "Последний вопрос" : "Последний ответ";
  return `${prefix}: ${excerpt(last.content, 120)}`;
}

type BuildContextInput = {
  state: WorkspaceState;
  activeProjectId: string | null;
  activeChatId: string | null;
  mode: string;
};

export function buildAiContext({
  state,
  activeProjectId,
  activeChatId,
  mode,
}: BuildContextInput): AiWorkspaceContext {
  const project = state.projects.find((p) => p.id === activeProjectId);

  const projectChats = state.chats.filter(
    (c) => c.projectId === activeProjectId && c.id !== activeChatId && c.messages.length > 0
  );

  const relatedChats = projectChats
    .slice(0, MAX_RELATED_CHATS)
    .map((c) => ({
      title: c.title,
      summary: chatSummary(c.messages),
    }));

  const projectArtifacts = state.artifacts
    .filter((a) => a.projectId === activeProjectId || (!activeProjectId && !a.projectId))
    .slice(0, MAX_ARTIFACTS)
    .map((a) => ({
      title: a.title,
      type: a.type,
      excerpt: excerpt(a.content),
    }));

  const otherProjects = state.projects
    .filter((p) => p.id !== activeProjectId)
    .slice(0, MAX_OTHER_PROJECTS)
    .map((p) => ({
      name: p.name,
      instructions: p.instructions,
    }));

  const approvedMemories = state.memories
    .filter((m) => m.status === "APPROVED")
    .filter((m) => !activeProjectId || m.projectId === activeProjectId || !m.projectId)
    .map((m) => m.content);

  return {
    mode,
    userRole: state.userRole,
    aiPreferences: state.aiPreferences,
    projectName: project?.name,
    projectDescription: project?.description,
    projectInstructions: project?.instructions,
    memories: approvedMemories.length > 0 ? approvedMemories : undefined,
    relatedChats: relatedChats.length > 0 ? relatedChats : undefined,
    artifacts: projectArtifacts.length > 0 ? projectArtifacts : undefined,
    otherProjects: otherProjects.length > 0 ? otherProjects : undefined,
  };
}

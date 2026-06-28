import type { AssembledContext, AgentRunInput, VectorMemoryHit } from "@/server/agent/types";
import { prisma } from "@/lib/prisma";
import { searchVectorMemory } from "@/server/memory/vector-search";

const EXCERPT_LEN = 180;
const MAX_RELATED_CHATS = 4;
const MAX_ARTIFACTS = 6;
const MAX_OTHER_PROJECTS = 3;
const MAX_RECENT_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 12_000;

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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Assembles token-budgeted context from workspace snapshot + server-side vector search.
 * Workspace data comes from the client (instant, offline-capable).
 * Vector search runs server-side when userId is present.
 */
export async function assembleContext(
  input: AgentRunInput
): Promise<AssembledContext> {
  const { workspace, projectId, chatId, message, mode } = input;
  const activeProjectId = projectId;

  const project = workspace.projects.find((p) => p.id === activeProjectId);

  const projectChats = workspace.chats.filter(
    (c) => c.projectId === activeProjectId && c.id !== chatId && c.messages.length > 0
  );

  const relatedChats = projectChats.slice(0, MAX_RELATED_CHATS).map((c) => ({
    title: c.title,
    summary: chatSummary(c.messages),
  }));

  const projectArtifacts = workspace.artifacts
    .filter(
      (a) =>
        a.projectId === activeProjectId ||
        (!activeProjectId && !a.projectId)
    )
    .slice(0, MAX_ARTIFACTS)
    .map((a) => ({
      title: a.title,
      type: a.type,
      excerpt: excerpt(a.content),
    }));

  const otherProjects = workspace.projects
    .filter((p) => p.id !== activeProjectId)
    .slice(0, MAX_OTHER_PROJECTS)
    .map((p) => ({
      name: p.name,
      instructions: p.instructions,
    }));

  const approvedMemories = workspace.memories
    .filter((m) => m.status === "APPROVED")
    .filter(
      (m) =>
        !activeProjectId || m.projectId === activeProjectId || !m.projectId
    )
    .map((m) => m.content);

  let vectorMemoriesRaw: VectorMemoryHit[] = [];

  if (input.userId && message.trim()) {
    vectorMemoriesRaw = await searchVectorMemory({
      userId: input.userId,
      projectId: activeProjectId ?? undefined,
      query: message,
      limit: 6,
    });
  }

  let userRole: string | null = null;
  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { userRole: true },
    });
    userRole = user?.userRole ?? null;
  }

  const recentMessages = trimMessages(
    [...input.history, { role: "user" as const, content: input.message }],
    MAX_RECENT_MESSAGES,
    MAX_MESSAGE_CHARS
  );

  const context: AssembledContext = {
    mode,
    userRole,
    aiPreferences: workspace.aiPreferences,
    projectName: project?.name,
    projectDescription: project?.description,
    projectInstructions: project?.instructions,
    memories: approvedMemories.length > 0 ? approvedMemories : undefined,
    vectorMemories:
      vectorMemoriesRaw.length > 0
        ? vectorMemoriesRaw.map((h) => h.content)
        : undefined,
    relatedChats: relatedChats.length > 0 ? relatedChats : undefined,
    artifacts: projectArtifacts.length > 0 ? projectArtifacts : undefined,
    otherProjects: otherProjects.length > 0 ? otherProjects : undefined,
    recentMessages,
    vectorMemoriesRaw,
    tokenEstimate: 0,
  };

  context.tokenEstimate = estimateTokens(
    JSON.stringify({
      memories: context.memories,
      vector: context.vectorMemories,
      artifacts: context.artifacts,
      messages: recentMessages,
    })
  );

  return context;
}

function trimMessages(
  messages: AgentRunInput["history"],
  maxCount: number,
  maxChars: number
): AgentRunInput["history"] {
  const sliced = messages.slice(-maxCount);
  let total = 0;
  const result: AgentRunInput["history"] = [];

  for (let i = sliced.length - 1; i >= 0; i--) {
    const msg = sliced[i];
    total += msg.content.length;
    if (total > maxChars && result.length > 2) break;
    result.unshift(msg);
  }

  return result;
}

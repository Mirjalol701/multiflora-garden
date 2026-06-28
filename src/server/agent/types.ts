import type { AgentRunPhase, AgentSSEEvent } from "@/lib/agent-events";
import type { AiWorkspaceContext } from "@/lib/zyron-prompt";

export type AgentMessageRole = "user" | "assistant" | "model";

export type AgentMessage = {
  role: AgentMessageRole;
  content: string;
  toolCalls?: import("@/server/ai/types").ToolCall[];
  toolResults?: import("@/server/ai/types").ToolObservation[];
};

export type WorkspaceSnapshot = {
  projects: {
    id: string;
    name: string;
    description?: string;
    instructions?: string;
    color: string;
  }[];
  chats: {
    id: string;
    title: string;
    projectId?: string | null;
    messages: { role: string; content: string }[];
  }[];
  artifacts: {
    id: string;
    title: string;
    content: string;
    type: string;
    projectId?: string | null;
  }[];
  memories: {
    id: string;
    content: string;
    status: string;
    projectId?: string | null;
  }[];
  userRole?: string | null;
  aiPreferences?: AiWorkspaceContext["aiPreferences"];
};

export type ImageAttachmentInput = {
  type: "image";
  dataUrl: string;
  name: string;
};

export type AgentRunInput = {
  userId?: string;
  chatId: string;
  projectId?: string | null;
  message: string;
  mode: "chat" | "cowork" | "code";
  history: AgentMessage[];
  workspace: WorkspaceSnapshot;
  runId: string;
  imageAttachments?: ImageAttachmentInput[];
};

export type VectorMemoryHit = {
  id: string;
  sourceType: string;
  sourceId: string;
  content: string;
  similarity: number;
};

export type AssembledContext = AiWorkspaceContext & {
  recentMessages: AgentMessage[];
  vectorMemoriesRaw: VectorMemoryHit[];
  tokenEstimate: number;
};

export type AgentEventEmitter = (event: AgentSSEEvent) => void;

export type CompletedRun = {
  runId: string;
  userId?: string;
  chatId: string;
  projectId?: string | null;
  userMessage: string;
  assistantMessage: string;
  projectName?: string;
  toolCallsCount: number;
  model: string;
};

export type { AgentRunPhase, AgentSSEEvent };

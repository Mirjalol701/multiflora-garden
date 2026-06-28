export type WorkspaceMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

export type WorkspaceChat = {
  id: string;
  title: string;
  messages: WorkspaceMessage[];
  projectId?: string | null;
  mode: "chat" | "cowork" | "code";
  createdAt: string;
};

export type WorkspaceProject = {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  color: string;
  createdAt: string;
};

export type ArtifactType = "document" | "code" | "plan";

export type WorkspaceArtifact = {
  id: string;
  title: string;
  content: string;
  type: ArtifactType;
  projectId?: string | null;
  chatId?: string | null;
  shareToken?: string | null;
  isPublic: boolean;
  version: number;
  createdAt: string;
};

export type MemoryStatus = "PENDING" | "APPROVED" | "REJECTED";

export type WorkspaceMemory = {
  id: string;
  content: string;
  status: MemoryStatus;
  projectId?: string | null;
  source?: string;
  createdAt: string;
};

export type UserRole = "founder" | "dev" | "researcher" | "creator";

export type AiPreferences = {
  tone: "concise" | "balanced" | "detailed";
  proactivity: "low" | "medium" | "high";
};

export type WorkspaceState = {
  version: 1;
  chats: WorkspaceChat[];
  projects: WorkspaceProject[];
  artifacts: WorkspaceArtifact[];
  memories: WorkspaceMemory[];
  activeProjectId: string | null;
  onboardingCompleted: boolean;
  userRole: UserRole | null;
  aiPreferences: AiPreferences;
};

export const DEFAULT_AI_PREFERENCES: AiPreferences = {
  tone: "balanced",
  proactivity: "medium",
};

export const EMPTY_WORKSPACE: WorkspaceState = {
  version: 1,
  chats: [],
  projects: [],
  artifacts: [],
  memories: [],
  activeProjectId: null,
  onboardingCompleted: false,
  userRole: null,
  aiPreferences: DEFAULT_AI_PREFERENCES,
};

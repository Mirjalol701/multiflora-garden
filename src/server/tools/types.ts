import type { ToolSchema, ToolCall, ToolObservation } from "@/server/ai/types";

export type ToolContext = {
  userId?: string;
  projectId?: string | null;
  chatId: string;
  runId: string;
  onArtifact?: (data: {
    title: string;
    content: string;
    artifactType: string;
  }) => void;
};

export type ZyronTool = {
  name: string;
  schema: ToolSchema;
  execute: (
    args: Record<string, unknown>,
    ctx: ToolContext
  ) => Promise<unknown>;
  summarize: (result: unknown) => string;
};

export type { ToolCall, ToolObservation, ToolSchema };

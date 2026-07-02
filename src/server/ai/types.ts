import type { AgentMessage } from "@/server/agent/types";

export type ToolSchema = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
};

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolObservation = {
  id: string;
  name: string;
  result: string;
  summary: string;
};

export type ModelConfig = {
  provider: "openai" | "anthropic";
  model: string;
  temperature?: number;
  maxTokens?: number;
};

export type CompleteParams = {
  system: string;
  messages: AgentMessage[];
  tools?: ToolSchema[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  imageAttachments?: { dataUrl: string; name: string }[];
};

export type CompleteResult = {
  text: string;
  toolCalls: ToolCall[];
  model: string;
};

export type StreamChunk =
  | { type: "text"; text: string }
  | { type: "tool_call"; call: ToolCall };

export interface AIProvider {
  id: ModelConfig["provider"];
  complete(params: CompleteParams): Promise<CompleteResult>;
  stream(params: CompleteParams): AsyncGenerator<StreamChunk>;
  embed(text: string): Promise<number[]>;
}

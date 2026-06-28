import type { ToolCall, ToolObservation, ToolSchema } from "@/server/ai/types";
import { searchMemoryTool } from "./search-memory";
import { createArtifactTool } from "./create-artifact";
import { webSearchTool } from "./web-search-tool";
import type { ToolContext, ZyronTool } from "./types";

const ALL_TOOLS: ZyronTool[] = [webSearchTool, searchMemoryTool, createArtifactTool];

const MODE_TOOLS: Record<string, string[]> = {
  chat: ["web_search", "search_memory", "create_artifact"],
  cowork: ["web_search", "search_memory", "create_artifact"],
  code: ["web_search", "search_memory", "create_artifact"],
};

export const toolRegistry = {
  getSchemas(mode: string): ToolSchema[] {
    const allowed = MODE_TOOLS[mode] ?? MODE_TOOLS.chat;
    return ALL_TOOLS.filter((t) => allowed.includes(t.name)).map((t) => t.schema);
  },

  getToolNames(mode: string): string[] {
    return MODE_TOOLS[mode] ?? MODE_TOOLS.chat;
  },

  async execute(call: ToolCall, ctx: ToolContext): Promise<ToolObservation> {
    const tool = ALL_TOOLS.find((t) => t.name === call.name);
    if (!tool) {
      return {
        id: call.id,
        name: call.name,
        result: JSON.stringify({ error: `Unknown tool: ${call.name}` }),
        summary: `Tool not found: ${call.name}`,
      };
    }

    try {
      const result = await tool.execute(call.arguments, ctx);
      return {
        id: call.id,
        name: call.name,
        result: JSON.stringify(result),
        summary: tool.summarize(result),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool execution failed";
      return {
        id: call.id,
        name: call.name,
        result: JSON.stringify({ error: message }),
        summary: `Error: ${message}`,
      };
    }
  },

  async executeAll(
    calls: ToolCall[],
    ctx: ToolContext
  ): Promise<ToolObservation[]> {
    return Promise.all(calls.map((call) => this.execute(call, ctx)));
  },
};

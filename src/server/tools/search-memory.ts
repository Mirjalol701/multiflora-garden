import { searchVectorMemory } from "@/server/memory/vector-search";
import type { ZyronTool } from "./types";

export const searchMemoryTool: ZyronTool = {
  name: "search_memory",
  schema: {
    name: "search_memory",
    description:
      "Semantic search across approved memories and indexed workspace knowledge",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query — what to look up in memory",
        },
        scope: {
          type: "string",
          enum: ["project", "all"],
          description: "project = current project + global; all = entire workspace",
        },
      },
      required: ["query"],
    },
  },

  async execute(args, ctx) {
    const query = String(args.query ?? "").trim();
    if (!query) return { hits: [] };

    if (!ctx.userId) {
      return { hits: [], note: "No user session — memory search limited" };
    }

    const scope = args.scope === "all" ? undefined : ctx.projectId ?? undefined;
    const hits = await searchVectorMemory({
      userId: ctx.userId,
      projectId: scope,
      query,
      limit: 6,
    });

    return {
      hits: hits.map((h) => ({
        content: h.content,
        source: h.sourceType,
        relevance: Math.round(h.similarity * 100) / 100,
      })),
    };
  },

  summarize(result) {
    const hits = (result as { hits?: unknown[] }).hits ?? [];
    return `Found ${hits.length} memory hits`;
  },
};

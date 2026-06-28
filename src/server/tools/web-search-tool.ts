import { searchWeb } from "./web-search";
import type { ZyronTool } from "./types";

export const webSearchTool: ZyronTool = {
  name: "web_search",
  schema: {
    name: "web_search",
    description:
      "Search the web for current facts, definitions, tech terms, news, and documentation. Use BEFORE answering definition or time-sensitive questions.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query — specific and include year for fast-moving topics",
        },
      },
      required: ["query"],
    },
  },

  async execute(args) {
    const query = String(args.query ?? "").trim();
    if (!query) return { hits: [], available: false };

    if (!process.env.TAVILY_API_KEY?.trim()) {
      return {
        hits: [],
        available: false,
        note: "TAVILY_API_KEY not configured — answer from model knowledge and state uncertainty for recent terms.",
      };
    }

    const hits = await searchWeb(query);
    return {
      available: true,
      hits: hits.map((h) => ({
        title: h.title,
        url: h.url,
        excerpt: h.content,
      })),
    };
  },

  summarize(result) {
    const r = result as { hits?: unknown[]; available?: boolean };
    if (r.available === false) return "Web search unavailable";
    return `Found ${r.hits?.length ?? 0} web results`;
  },
};

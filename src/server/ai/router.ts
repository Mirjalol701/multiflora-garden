import { openaiProvider } from "./providers/openai";
import type { AIProvider, ModelConfig } from "./types";

const ROUTING: Record<string, ModelConfig> = {
  zyron: { provider: "openai", model: "gpt-4.1-mini", temperature: 0.7, maxTokens: 8192 },
  "extract:fast": {
    provider: "openai",
    model: "gpt-4.1-mini",
    temperature: 0.15,
    maxTokens: 256,
  },
};

export function getProvider(): AIProvider {
  return openaiProvider;
}

export const modelRouter = {
  forZyron(): { provider: AIProvider; config: ModelConfig } {
    const config = ROUTING.zyron;
    return { provider: openaiProvider, config };
  },

  forChat(): { provider: AIProvider; config: ModelConfig } {
    const config = ROUTING.zyron;
    return { provider: openaiProvider, config };
  },

  forExtraction(): AIProvider {
    return openaiProvider;
  },
};

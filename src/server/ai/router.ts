import { geminiProvider } from "./providers/gemini";
import { openaiProvider } from "./providers/openai";
import type { AIProvider, ModelConfig } from "./types";

const providers: Record<string, AIProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
};

const ROUTING: Record<string, ModelConfig> = {
  zyron: { provider: "openai", model: "gpt-4.1-mini", temperature: 0.7, maxTokens: 8192 },
  "extract:fast": { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.15, maxTokens: 256 },
};

export function getProvider(id: ModelConfig["provider"]): AIProvider {
  const provider = providers[id];
  if (!provider) throw new Error(`Provider not configured: ${id}`);
  return provider;
}

export const modelRouter = {
  forZyron(): { provider: AIProvider; config: ModelConfig } {
    const config = ROUTING.zyron;
    return { provider: getProvider(config.provider), config };
  },

  forChat(): { provider: AIProvider; config: ModelConfig } {
    const config = ROUTING.zyron;
    return { provider: getProvider(config.provider), config };
  },

  forExtraction(): AIProvider {
    return getProvider("gemini");
  },
};

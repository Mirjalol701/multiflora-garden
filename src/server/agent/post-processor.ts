import { modelRouter } from "@/server/ai/router";
import type { CompletedRun } from "@/server/agent/types";
import type { AgentSSEEvent } from "@/lib/agent-events";

const EXTRACTION_PROMPT = `Extract 0-2 durable facts worth remembering from this exchange.
Return ONLY a JSON array of strings. Empty array [] if nothing worth saving.
Facts must be specific, timeless, and about user preferences/decisions — not transient chat.
Example: ["User prefers TypeScript over JavaScript", "Project uses Neon Postgres"]`;

export async function extractMemoryCandidates(
  run: CompletedRun
): Promise<string[]> {
  if (!run.assistantMessage.trim() || run.assistantMessage.length < 80) {
    return [];
  }

  try {
    const provider = modelRouter.forExtraction();
    const result = await provider.complete({
      system: EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Project: ${run.projectName ?? "none"}\n\nUser: ${run.userMessage}\n\nAssistant: ${run.assistantMessage.slice(0, 2000)}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 256,
    });

    const match = result.text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((x): x is string => typeof x === "string" && x.trim().length > 10)
      .slice(0, 2);
  } catch {
    return [];
  }
}

export async function postProcessRun(
  run: CompletedRun,
  emit: (event: AgentSSEEvent) => void
): Promise<void> {
  emit({ type: "phase", phase: "post_processing" });

  const candidates = await extractMemoryCandidates(run);
  for (const content of candidates) {
    emit({ type: "memory_candidate", content });
  }
}

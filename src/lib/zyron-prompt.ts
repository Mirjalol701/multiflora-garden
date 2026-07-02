/**
 * System prompt engine — MultiFlora chat + Zyron agent.
 */

export const MULTIFLORA_IDENTITY = `You are the AI garden expert of a plant nursery & landscape studio.

You are NOT a generic chatbot. You help customers choose plants, plan gardens, and care for them.
Stay on topic: plants, gardens, landscaping, plant care, and garden planning.
When recommending plants, use the real catalog and give practical, climate-aware advice.

Always respond in the same language the user writes in.`;

export const ZYRON_IDENTITY = `You are the AI garden expert & planting advisor of a plant nursery.

Role: horticulture specialist + landscape designer. You recommend real catalog plants,
plan gardens, and advise on care (sunlight, watering, soil, hardiness, spacing, season).
Always respond in the same language the user writes in.`;

export const ACCURACY_RULES = `## Accuracy Rules (CRITICAL)

- For definitions and tech terms ("что такое X", "what is X"): give the **current industry meaning (2024–2026)** first, not outdated or generic interpretations.
- If a term has multiple meanings, list the **dominant tech meaning first**, then alternatives briefly.
- For fast-moving topics (AI tools, frameworks, slang like "vibe coding"): prefer web_search results when provided; if absent, state uncertainty.
- Never invent a confident answer when unsure — say "не уверен" / "recommend verifying" instead.
- Separate clearly: **fact** vs **opinion** vs **recommendation**.
- For code: working examples only; mention versions/deps when they matter.
- Do not confuse wellness/productivity advice with technical definitions.
- **Statistics & claims**: never invent numbers. Only cite stats if they appear in Web Search Results; label as "по данным [источник]" or skip.
- **Origin**: for coined terms, name who introduced it and approximate date/month/year when known from search.
- **Alternatives**: if a term has a non-tech meaning, one sentence max — do not let it dominate.`;

export const DEFINITION_FORMAT = `## Definition Response Format (MANDATORY for "что такое X")

Use exactly these sections in order:

**Определение:** 2–4 sentences. Dominant industry/tech meaning only. Precise, no fluff.

**Источник:** Who coined or popularized the term + when (month/year if known). Example: "Термин ввёл Andrej Karpathy, февраль 2025". If unknown after search: "Точный автор не подтверждён".

**Контекст:** Why it matters now, who uses it, how it differs from classic coding. No unverified stats.

**Пример:** One concrete, practical scenario (2–3 sentences).

**Уверенность:** high / medium / low — one line explaining why.

Then **Следующий шаг:** one actionable follow-up.

Do NOT use other section names. Do NOT skip **Источник** or **Уверенность**.`;

export const ZYRON_BEHAVIOR = `## Zyron Behavior Contract

### Workspace Intelligence
- Treat injected workspace context as ground truth
- Use search_memory before guessing about past decisions
- Flag contradictions with approved memory

### Tools (use proactively)
- **web_search** — definitions, current facts, docs, fast-moving tech terms (call BEFORE answering)
- **search_memory** — user's past decisions and project facts
- **create_artifact** — substantial deliverables
- Never fabricate tool results

### Output
- End substantive replies with **Следующий шаг:** — one concrete action
- Deliverables > endless chat`;

export const MULTIFLORA_BEHAVIOR = `## Behavior
- Use workspace context when provided
- Be direct, structured, high-value
- End actionable replies with **Следующий шаг:** when appropriate`;

export const MODE_PROMPTS: Record<string, string> = {
  chat: `Mode: Chat — clear, accurate, adaptive.`,
  cowork: `Mode: Cowork — decisions, trade-offs, stakeholder-ready summaries.`,
  code: `Mode: Code — correct code, architecture, best practices.`,
};

export type AiPreferences = {
  tone: "concise" | "balanced" | "detailed";
  proactivity: "low" | "medium" | "high";
};

export type AiWorkspaceContext = {
  mode?: string;
  userRole?: string | null;
  aiPreferences?: AiPreferences;
  projectName?: string;
  projectDescription?: string;
  projectInstructions?: string;
  memories?: string[];
  vectorMemories?: string[];
  relatedChats?: { title: string; summary: string }[];
  artifacts?: { title: string; excerpt: string; type: string }[];
  otherProjects?: { name: string; instructions?: string }[];
  availableTools?: string[];
  webSearchResults?: string;
  queryHint?: string;
  responseFormat?: "definition";
  termKnowledge?: string;
};

export const OUTPUT_RULES = `## Output Rules
- No filler openers ("Конечно!", "Great question!")
- Markdown for answers >150 words`;

function appendOutputRules(context?: AiWorkspaceContext): string {
  if (context?.responseFormat === "definition") {
    return `${OUTPUT_RULES}\n\n${DEFINITION_FORMAT}`;
  }
  return `${OUTPUT_RULES}\n- For definitions use: **Определение** → **Источник** → **Контекст** → **Пример** → **Уверенность**`;
}

function appendWorkspaceContext(context: AiWorkspaceContext | undefined): string[] {
  const blocks: string[] = [];

  if (context?.termKnowledge?.trim()) {
    blocks.push(
      `## Verified Term Knowledge (authoritative — use in **Источник**)\n${context.termKnowledge.trim()}`
    );
  }

  if (context?.queryHint) {
    blocks.push(`## Query Guidance\n${context.queryHint}`);
  }

  if (context?.webSearchResults?.trim()) {
    blocks.push(
      `## Web Search Results (use as primary source for facts)\n${context.webSearchResults.trim()}`
    );
  }

  if (context?.projectName) {
    let block = `## Active Project: ${context.projectName}`;
    if (context.projectDescription?.trim()) {
      block += `\nDescription: ${context.projectDescription.trim()}`;
    }
    if (context.projectInstructions?.trim()) {
      block += `\nInstructions:\n${context.projectInstructions.trim()}`;
    }
    blocks.push(block);
  }

  if (context?.memories?.length) {
    blocks.push(
      `## Approved Memory\n${context.memories.map((m) => `- ${m}`).join("\n")}`
    );
  }

  if (context?.vectorMemories?.length) {
    blocks.push(
      `## Retrieved Memory\n${context.vectorMemories.map((m) => `- ${m}`).join("\n")}`
    );
  }

  if (context?.relatedChats?.length) {
    blocks.push(
      `## Related Chats\n${context.relatedChats.map((c) => `- **${c.title}**: ${c.summary}`).join("\n")}`
    );
  }

  if (context?.artifacts?.length) {
    blocks.push(
      `## Artifacts\n${context.artifacts.map((a) => `- [${a.type}] **${a.title}**: ${a.excerpt}`).join("\n")}`
    );
  }

  if (context?.otherProjects?.length) {
    blocks.push(
      `## Other Projects\n${context.otherProjects.map((p) => `- **${p.name}**`).join("\n")}`
    );
  }

  return blocks;
}

function appendPreferences(context?: AiWorkspaceContext): string[] {
  const parts: string[] = [];
  if (context?.mode && MODE_PROMPTS[context.mode]) {
    parts.push(MODE_PROMPTS[context.mode]);
  }
  if (context?.userRole) {
    parts.push(`User profile: ${context.userRole}`);
  }
  if (context?.aiPreferences) {
    parts.push(
      `Preferences: tone=${context.aiPreferences.tone}, proactivity=${context.aiPreferences.proactivity}`
    );
  }
  return parts;
}

export function buildMultifloraSystemPrompt(context?: AiWorkspaceContext): string {
  const parts = [MULTIFLORA_IDENTITY, MULTIFLORA_BEHAVIOR, ACCURACY_RULES];
  parts.push(...appendPreferences(context));

  const workspaceBlocks = appendWorkspaceContext(context);
  if (workspaceBlocks.length > 0) {
    parts.push(`## Workspace Context\n\n${workspaceBlocks.join("\n\n")}`);
  }

  parts.push(appendOutputRules(context));
  return parts.join("\n\n");
}

function formatCurrentDateTime(): string {
  const now = new Date();
  const tashkent = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const utc = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  return `Ташкент (UTC+5): ${tashkent}\nUTC: ${utc}`;
}

export const GARDENER_IDENTITY = `You are the AI garden expert of a plant nursery & landscape studio.
You help customers choose plants, plan gardens, and care for them.

Core rules:
- You are a horticulture & landscape specialist — NOT a generic chatbot. Stay on topic: plants, gardens, landscaping, plant care, garden planning.
- Respond in the same language the user writes in.
- When the user asks what to plant, for recommendations, prices, availability, or garden planning: ALWAYS call the "search_plants" tool and recommend REAL plants from the catalog (with their names and prices). Never invent plants or prices.
- Give practical, climate-aware advice: sunlight, watering, soil, hardiness, spacing, season of planting.
- Be concise and structured. Prefer short lists of concrete plant suggestions over long essays.
- When relevant, gently invite the user to request planting/delivery or a consultation.
- Do not add unsolicited "Next step" boilerplate unless the user asks.`;

/** Garden-expert prompt with live catalog access via the search_plants tool. */
export function buildZyronSystemPrompt(context?: AiWorkspaceContext): string {
  const parts = [
    GARDENER_IDENTITY,
    `## Current date and time\n${formatCurrentDateTime()}`,
  ];

  if (context?.webSearchResults?.trim()) {
    parts.push(
      `## Web search results (use for factual questions)\n${context.webSearchResults.trim()}`
    );
  }

  if (context?.projectInstructions?.trim()) {
    parts.push(`## Project instructions\n${context.projectInstructions.trim()}`);
  }

  return parts.join("\n\n");
}

export const buildAiSystemPrompt = buildMultifloraSystemPrompt;
export const AI_OS_IDENTITY = MULTIFLORA_IDENTITY;
export const AI_OS_BEHAVIOR = MULTIFLORA_BEHAVIOR;

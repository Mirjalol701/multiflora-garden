export type QueryIntent =
  | "definition"
  | "code"
  | "workspace"
  | "creative"
  | "general";

export type QueryClassification = {
  intent: QueryIntent;
  needsWebSearch: boolean;
  hint: string;
  responseFormat?: "definition";
};

const DEFINITION_PATTERNS = [
  /^что такое\s+/i,
  /^что значит\s+/i,
  /^объясни\s+(что такое|термин|понятие)/i,
  /^define\s+/i,
  /^what is\s+/i,
  /^what's\s+/i,
  /^explain\s+/i,
];

const SEARCH_PATTERNS = [
  /актуальн/i,
  /последн/i,
  /latest/i,
  /current/i,
  /202[4-9]/,
  /версия\s+\d/i,
  /как работает\s+/i,
  /how does\s+.+\s+work/i,
  /сегодня/i,
  /текущ/i,
  /сейчас/i,
  /какое\s+время/i,
  /какая\s+(дата|число)/i,
  /который\s+час/i,
  /what\s+time/i,
  /what('s|\s+is)\s+the\s+date/i,
  /current\s+date/i,
  /today/i,
];

/** Factual lookups — companies, places, "does X exist in Y" */
const FACTUAL_PATTERNS = [
  /\bесть\s+(ли\s+)?/i,
  /\bсуществует\s+(ли\s+)?/i,
  /\bработает\s+ли\b/i,
  /\bнаходится\s+ли\b/i,
  /\bis there\b/i,
  /\bdoes\s+.+\s+exist\b/i,
  /\bв\s+узбекистан/i,
  /\bin\s+uzbekistan\b/i,
  /\bбанк\b/i,
  /\bbank\b/i,
];

const CODE_PATTERNS = [
  /```/,
  /\b(function|class|import|export|const|async|def |npm |typescript|react)\b/i,
  /напиши\s+(код|функци|компонент|api)/i,
  /write\s+(code|function|component)/i,
  /исправь\s+(ошибк|баг|код)/i,
  /fix\s+(this|the)\s+(bug|error|code)/i,
];

const WORKSPACE_PATTERNS = [
  /проект/i,
  /artifact/i,
  /память/i,
  /memory/i,
  /наш\s+план/i,
  /ранее\s+(мы|вы)/i,
];

export function classifyQuery(message: string): QueryClassification {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (DEFINITION_PATTERNS.some((p) => p.test(lower))) {
    return {
      intent: "definition",
      needsWebSearch: true,
      responseFormat: "definition",
      hint: `Definition question — follow the Definition Response Format exactly.
- Use web search results as primary source for origin, year, and who coined the term.
- Name the person/org if known (e.g. Andrej Karpathy for vibe coding, Feb 2025).
- Do NOT state specific statistics (%, funding, YC batches) unless they appear verbatim in Web Search Results; otherwise omit or say "по открытым данным, требует проверки".
- Dominant tech/industry meaning FIRST; alternative meanings in one short line only.`,
    };
  }

  if (SEARCH_PATTERNS.some((p) => p.test(lower))) {
    return {
      intent: "general",
      needsWebSearch: true,
      hint: "Time-sensitive or factual question — prefer web_search before answering from memory alone.",
    };
  }

  if (FACTUAL_PATTERNS.some((p) => p.test(lower))) {
    return {
      intent: "general",
      needsWebSearch: true,
      hint: "Factual lookup — use web search results; cite sources when possible. Answer yes/no clearly first.",
    };
  }

  if (CODE_PATTERNS.some((p) => p.test(text))) {
    return {
      intent: "code",
      needsWebSearch: lower.includes("документац") || lower.includes("documentation"),
      hint: "Code task — be precise, show working code, mention versions when relevant.",
    };
  }

  if (WORKSPACE_PATTERNS.some((p) => p.test(lower))) {
    return {
      intent: "workspace",
      needsWebSearch: false,
      hint: "Workspace context question — use search_memory and injected project context first.",
    };
  }

  if (
    lower.includes("идея") ||
    lower.includes("придумай") ||
    lower.includes("brainstorm")
  ) {
    return {
      intent: "creative",
      needsWebSearch: false,
      hint: "Creative task — structure ideas clearly; facts optional.",
    };
  }

  return {
    intent: "general",
    needsWebSearch: false,
    hint: "Answer directly and accurately. Say when uncertain.",
  };
}

/** Enrich search query for definition questions — better origin/year hits */
export function buildSearchQuery(
  message: string,
  classification: QueryClassification
): string {
  if (classification.intent !== "definition") {
    return message.slice(0, 400);
  }

  const term = message
    .replace(
      /^(что такое|что значит|объясни что такое|define|what is|what's|explain)\s+/i,
      ""
    )
    .replace(/\s+в программировани[иеяю]?\s*$/i, "")
    .replace(/\s+in programming\s*$/i, "")
    .trim();

  const lower = term.toLowerCase();
  if (
    lower.includes("вайб") ||
    lower.includes("vibe") &&
      (lower.includes("код") || lower.includes("coding"))
  ) {
    return "vibe coding Andrej Karpathy February 2025 definition programming LLM".slice(
      0,
      400
    );
  }

  return `${term} programming definition origin coined by year 2025 2026`.slice(0, 400);
}

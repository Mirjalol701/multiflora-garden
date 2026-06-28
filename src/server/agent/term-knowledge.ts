/**
 * Curated high-confidence facts for fast-moving terms.
 * Injected alongside web search — not a replacement, but fills gaps when search misses origin.
 */
export function getTermKnowledgeHint(message: string): string | undefined {
  const lower = message.toLowerCase().replace(/ё/g, "е");

  const isVibeCoding =
    (lower.includes("вайб") && (lower.includes("код") || lower.includes("coding"))) ||
    lower.includes("vibe coding") ||
    lower.includes("vibe-coding");

  if (isVibeCoding) {
    return `Verified term knowledge (use in **Источник**):
- "Vibe coding" popularized by **Andrej Karpathy**, February 2025
- Core idea: developer describes intent in natural language; LLM writes/edits code; human directs and reviews
- Karpathy's framing: "fully give in to the vibes", accept AI-generated code, iterate conversationally
- Tools: Cursor, Copilot, Claude Code, Windsurf — not wellness/productivity "coding atmosphere"`;
  }

  return undefined;
}

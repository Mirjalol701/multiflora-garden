/** Lightweight sanitizer for LLM prompts — no jsdom/DOMPurify (Vercel-safe). */
export function sanitizeAiPrompt(input: string): string {
  return input.replace(/[\0\x08\x0B\x0C\x0E-\x1F]/g, "").trim().slice(0, 32_000);
}

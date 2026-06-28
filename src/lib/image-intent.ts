/** Detect requests to generate or recreate images (not just describe them). */
export function wantsImageGeneration(message: string, hasImageAttachment: boolean): boolean {
  const lower = message.toLowerCase();

  const explicit = [
    /нарисуй/i,
    /создай\s+(картин|изображ|фото|рисун)/i,
    /сгенерир\w*\s+(картин|изображ|фото)/i,
    /draw\s+/i,
    /generate\s+.*\bimage/i,
    /create\s+.*\bimage/i,
    /dall[\s-]?e/i,
    /сделай\s+.+\s+(фото|изображ|картин)/i,
    /на\s+форме/i,
    /в\s+форме\s+/i,
    /поменяй\s+форм/i,
    /измени\s+(фото|изображ)/i,
    /отредактир/i,
    /переделай\s+(фото|изображ)/i,
    /edit\s+(this\s+)?(photo|image)/i,
  ];

  if (explicit.some((p) => p.test(lower))) return true;

  if (
    hasImageAttachment &&
    /\b(сделай|создай|нарисуй|поменяй|измени|переделай|make|create|edit|put)\b/i.test(lower)
  ) {
    return true;
  }

  return false;
}

export function cleanImageUserMessage(message: string): string {
  return message
    .replace(/Изображение:\s*[^\n]+/gi, "")
    .replace(/---[\s\S]*?---/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
